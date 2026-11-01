#!/usr/bin/env python3
"""Explicit operator maintenance. Python 3.11+, no dependencies or credentials copied."""
import argparse
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile
import tomllib

SOURCE = Path(__file__).resolve().parents[1]
START = '<!-- agents:shared:start -->'
END = '<!-- agents:shared:end -->'


def read(path):
    for parent in [path, *path.parents]:
        if parent.is_symlink():
            raise ValueError(f'Symlink refused: {parent}')
    if not path.exists():
        return b''
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
        raise ValueError(f'Not a singly linked regular file: {path}')
    return path.read_bytes()


def merge(existing, wanted):
    if not isinstance(existing, dict):
        raise ValueError('Expected a configuration object')
    for key, value in wanted.items():
        if key not in existing:
            existing[key] = value
        elif isinstance(value, dict) and isinstance(existing[key], dict):
            merge(existing[key], value)
        elif existing[key] != value:
            raise ValueError(f'Conflicting configuration key: {key}')
    return existing


def instructions(old, shared):
    block = START + '\n' + shared.rstrip() + '\n' + END
    if START not in old and END not in old:
        return old + ('\n\n' if old else '') + block + '\n'
    if old.count(START) != 1 or old.count(END) != 1 or old.index(END) < old.index(START):
        raise ValueError('Malformed shared instruction markers')
    return old[:old.index(START)] + block + old[old.index(END) + len(END):]


def codex_config(old, servers):
    parsed = tomllib.loads(old)
    entries = parsed.get('mcp_servers', {})
    for name, value in servers.items():
        wanted = {'url': value['url']}
        if name in entries:
            if entries[name] != wanted:
                raise ValueError(f'Conflicting Codex MCP: {name}')
        else:
            old += f'\n[mcp_servers.{name}]\nurl = {json.dumps(value["url"])}\n'
    tomllib.loads(old)
    return old


def skill():
    root = SOURCE / 'skills/obsidian-markdown'
    text = (root / 'SKILL.md').read_text()
    _, front, body = text.split('---', 2)
    description = re.search(r'^description: (.+)$', front, re.M).group(1)
    for ref in sorted((root / 'references').glob('*.md')):
        anchor = 'reference-' + ref.stem.lower()
        body = body.replace('references/' + ref.name, '#' + anchor)
        body += f'\n\n## Reference {ref.stem}\n\n' + ref.read_text()
    # Avoid the service's dynamic-command sentinel in this prose example.
    body = body.replace('with `!` to embed', 'with an exclamation mark to embed')
    if re.search(r'!\s*`', body) or len(body.encode()) > 24000:
        raise ValueError('Skill text exceeds the service constraints; review source')
    return {'name': 'obsidian-markdown', 'description': description, 'instructions': body.strip()}


class MCP:
    def __enter__(self):
        self.process = subprocess.Popen(['/usr/bin/python3', '-I', '/opt/t3/skills_mcp.py'],
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        self.request('initialize', {'protocolVersion': '2024-11-05', 'capabilities': {},
                                   'clientInfo': {'name': 'agents-apply', 'version': '1'}})
        self.process.stdin.write(json.dumps({'jsonrpc': '2.0', 'method': 'notifications/initialized'}) + '\n')
        self.process.stdin.flush()
        return self

    def request(self, method, params):
        self.process.stdin.write(json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}) + '\n')
        self.process.stdin.flush()
        result = json.loads(self.process.stdout.readline())
        if 'error' in result:
            raise ValueError('Skill service rejected request')
        return result['result']

    def call(self, name, args):
        result = self.request('tools/call', {'name': name, 'arguments': args})
        if result.get('isError'):
            raise ValueError(f'Skill service rejected {name}; inspect with its supported tools')
        return json.loads(result['content'][0]['text'])

    def __exit__(self, *args):
        self.process.stdin.close()
        self.process.wait(timeout=10)
        self.process.stdout.close()


def plan(home):
    changes = []
    def add(relative, transform):
        path = home / relative
        old = read(path)
        new = transform(old.decode()).encode()
        if old != new:
            changes.append((path, old, new))
    shared = (SOURCE / 'AGENTS.md').read_text()
    for dest in ['.codex/AGENTS.md', '.claude/CLAUDE.md']:
        add(dest, lambda old: instructions(old, shared))
    servers = json.loads((SOURCE / 'mcp.json').read_text())
    if set(servers) != {'context7', 'tavily'} or any(set(v) != {'type', 'url'} or v['type'] != 'http' for v in servers.values()):
        raise ValueError('Expected exactly two header-free HTTP MCP definitions')
    add('.codex/config.toml', lambda old: codex_config(old, servers))
    def json_merge(old, wanted):
        original = json.loads(old or '{}')
        if not isinstance(original, dict):
            raise ValueError('Expected a configuration object')
        if 'mcpServers' in wanted:
            entries = original.get('mcpServers', {})
            if not isinstance(entries, dict):
                raise ValueError('Expected an MCP server object')
            for name, definition in wanted['mcpServers'].items():
                if name in entries and entries[name] != definition:
                    raise ValueError(f'Conflicting Claude MCP: {name}')
        new = merge(json.loads(old or '{}'), wanted)
        return old if new == original else json.dumps(new, indent=2) + '\n'
    add('.claude/.claude.json', lambda old: json_merge(old, {'mcpServers': servers}))
    settings = json.loads((SOURCE / 'claude/settings.json').read_text())
    if set(settings) != {'theme', 'pluginConfigs'}:
        raise ValueError('Unexpected shared Claude settings; review before extending scope')
    add('.claude/settings.json', lambda old: json_merge(old, settings))
    return changes


def write(path, old, new):
    if read(path) != old:
        raise ValueError(f'File changed during apply: {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix='.agents-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(new)
            stream.flush()
            os.fsync(stream.fileno())
        if read(path) != old:
            raise ValueError(f'File changed during apply: {path}')
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', '--dry-run', action='store_true', help='Preview; exit 1 if changes needed')
    args = parser.parse_args()
    home = Path.home()
    if home != Path('/home/t3') or os.environ.get('CODEX_HOME') != str(home / '.codex') or os.environ.get('CLAUDE_CONFIG_DIR') != str(home / '.claude'):
        raise ValueError('Run as the Hetzner T3 user with its established provider homes')
    changes = plan(home)
    wanted = skill()
    receipt = home / '.local/state/agents-apply.json'
    previous = read(receipt)
    state = json.loads(previous or '{}')
    with MCP() as mcp:
        names = mcp.call('list_skills', {})['names']
        old = mcp.call('get_skill', {'name': wanted['name']}) if wanted['name'] in names else None
        same = old is not None and all(old[k] == v for k, v in wanted.items())
        if old and not same and old['revision'] != state.get('skill_revision'):
            raise ValueError('Shared skill has independent edits; reconcile before applying')
        for path, _, _ in changes:
            print('Would update' if args.check else 'Update', path)
        print('Skill:', 'current' if same else 'would update' if args.check else 'update')
        if args.check:
            return int(bool(changes) or not same)
        # The service alone writes authoritative records and generated skill files.
        result = mcp.call('save_skill', {**wanted, **({'expected_revision': old['revision']} if old else {})})
        if not result.get('complete'):
            raise ValueError('Partial skill installation; retry the same apply')
        write(receipt, previous, (json.dumps({'skill_revision': result['revision']}) + '\n').encode())
        for path, before, after in changes:
            write(path, before, after)
    print('Applied. Restart idle agent sessions; authenticate each MCP separately on Hetzner.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, KeyError, TypeError) as error:
        # Never print parsed configuration or credential-bearing exception values.
        if isinstance(error, ValueError) and not isinstance(error, (json.JSONDecodeError, tomllib.TOMLDecodeError)):
            print(str(error))
        else:
            print('Invalid or inaccessible configuration; inspect locally without exposing account state.')
        raise SystemExit(2)
