import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
import apply


class ApplyTests(unittest.TestCase):
    def test_preservation_and_idempotence(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp).resolve()
            (home / '.claude').mkdir()
            state = {'oauthAccount': {'fixture': 'private'}, 'mcpServers': {'t3-skills': {'command': 'existing'}}, 'projects': {}}
            (home / '.claude/.claude.json').write_text(json.dumps(state))
            (home / '.codex').mkdir()
            (home / '.codex/config.toml').write_text('model = "keep"\n[mcp_servers.other]\ncommand = "keep"\n')
            (home / '.codex/AGENTS.md').write_text('# Hetzner rules\nKeep sandbox policies.\n')
            for path, old, new in apply.plan(home):
                apply.write(path, old, new)
            self.assertEqual(apply.plan(home), [])
            actual = json.loads((home / '.claude/.claude.json').read_text())
            for key in state:
                if key != 'mcpServers':
                    self.assertEqual(actual[key], state[key])
            self.assertEqual(actual['mcpServers']['t3-skills'], state['mcpServers']['t3-skills'])
            self.assertTrue((home / '.codex/AGENTS.md').read_text().startswith('# Hetzner rules'))
            self.assertEqual((home / '.claude/.claude.json').stat().st_nlink, 1)

    def test_conflict_fails_before_writing(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp).resolve()
            (home / '.codex').mkdir()
            path = home / '.codex/config.toml'
            original = '[mcp_servers.context7]\nurl = "https://different.invalid"\n'
            path.write_text(original)
            with self.assertRaises(ValueError):
                apply.plan(home)
            self.assertEqual(path.read_text(), original)
            self.assertFalse((home / '.codex/AGENTS.md').exists())

    def test_claude_mcp_conflicts_preserve_account_state(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp).resolve()
            (home / '.claude').mkdir()
            path = home / '.claude/.claude.json'
            definition = json.loads((apply.SOURCE / 'mcp.json').read_text())['context7']
            for existing in [
                {**definition, 'headers': {'Authorization': 'fixture'}},
                {**definition, 'url': 'https://different.invalid'},
            ]:
                original = json.dumps({'mcpServers': {'context7': existing}})
                path.write_text(original)
                with self.assertRaises(ValueError):
                    apply.plan(home)
                self.assertEqual(path.read_text(), original)
                self.assertFalse((home / '.codex/AGENTS.md').exists())

    def test_links_and_concurrent_change_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            file = root / 'account'
            file.write_text('private fixture')
            link = root / 'linked'
            link.symlink_to(file)
            with self.assertRaises(ValueError):
                apply.read(link)
            link.unlink()
            os.link(file, link)
            with self.assertRaises(ValueError):
                apply.read(file)
            link.unlink()
            with self.assertRaises(ValueError):
                apply.write(file, b'outdated', b'new')
            self.assertEqual(file.read_text(), 'private fixture')

    def test_shared_block_updates_preserve_local_guidance(self):
        first = apply.instructions('machine guidance\n', 'shared v1') + 'local footer\n'
        updated = apply.instructions(first, 'shared v2')
        self.assertIn('machine guidance', updated)
        self.assertIn('local footer', updated)
        self.assertNotIn('shared v1', updated)
        self.assertEqual(apply.instructions(updated, 'shared v2'), updated)
        with self.assertRaises(ValueError):
            apply.instructions(apply.END + apply.START, 'bad')

    def test_skill_contains_references_within_service_limit(self):
        record = apply.skill()
        self.assertLessEqual(len(record['instructions'].encode()), 24000)
        self.assertNotIn('(references/', record['instructions'])
        for heading in ['Reference CALLOUTS', 'Reference EMBEDS', 'Reference PROPERTIES']:
            self.assertIn(heading, record['instructions'])

    @unittest.skipUnless(os.environ.get('T3_SKILLS_SOURCE'), 'Optional image-owned service compatibility check')
    def test_image_service_install_retry_and_update(self):
        spec = importlib.util.spec_from_file_location('skills_mcp', os.environ['T3_SKILLS_SOURCE'])
        service = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(service)
        with tempfile.TemporaryDirectory() as temp:
            # macOS /var is a symlink: the service correctly requires real paths.
            home = str(Path(temp).resolve())
            api = service.Skills(home)
            wanted = apply.skill()
            first = api.call('save_skill', wanted)
            self.assertTrue(first['complete'])
            self.assertEqual(first['revision'], api.call('save_skill', wanted)['revision'])
            changed = {**wanted, 'instructions': wanted['instructions'] + '\nUpdated.'}
            with self.assertRaises(service.Rejected):
                api.call('save_skill', changed)
            result = api.call('save_skill', {**changed, 'expected_revision': first['revision']})
            self.assertTrue(result['complete'])
            for path in ['.agents/skills/t3-user-obsidian-markdown/SKILL.md', '.claude/skills/t3-user-obsidian-markdown/SKILL.md']:
                self.assertIn('Updated.', (Path(home) / path).read_text())


if __name__ == '__main__':
    unittest.main()
