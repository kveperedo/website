import { CommandBlock } from "../components/command-block";
import { Setup } from "../components/setup";

export const WorktrunkSetup = () => {
  return (
    <Setup.Item
      label={
        <>
          Worktrunk <Setup.Dash />
          <Setup.Link href="https://worktrunk.dev" />
        </>
      }
    >
      <Setup.Item label="Install worktrunk">
        <CommandBlock command="brew install worktrunk" />
      </Setup.Item>
      <Setup.Item label="Install shell integration">
        <CommandBlock command="wt config shell install" />
        <CommandBlock command='if command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi' />
      </Setup.Item>
      <Setup.Item label="Install the OpenCode activity plugin">
        <CommandBlock command="wt config plugins opencode install" />
      </Setup.Item>
      <Setup.Item label="Create and switch worktrees">
        <CommandBlock
          command={`wt switch --create <branch>
wt switch <branch>
wt list
wt remove`}
        />
      </Setup.Item>
      <Setup.Item label="Add a wtc alias to .zshrc">
        <CommandBlock command='alias wtc="wt switch --base=^ -c"' />
      </Setup.Item>
      <Setup.Item label="wtc creates a new worktree from the default branch">
        <CommandBlock command="wtc <branch>" />
      </Setup.Item>
    </Setup.Item>
  );
};

export const OpenCodeSetup = () => {
  return (
    <Setup.Item
      label={
        <>
          OpenCode <Setup.Dash />
          <Setup.Link href="https://opencode.ai" />
        </>
      }
    >
      <Setup.Item label="Install OpenCode">
        <CommandBlock command="brew install opencode" />
      </Setup.Item>
      <Setup.Item label="Start a session">
        <CommandBlock command="opencode" />
      </Setup.Item>
    </Setup.Item>
  );
};

export const GitSetup = () => {
  return (
    <Setup.Item label="Git">
      <Setup.Item label="Add pusho and pullm aliases to ~/.gitconfig">
        <CommandBlock
          language="gitconfig"
          command={`[alias]
    pullm = "!f() { branch=master; git show-ref --verify --quiet refs/remotes/origin/master || branch=main; git pull --rebase origin \\"$branch\\"; }; f"
    pusho = push -u origin HEAD`}
        />
      </Setup.Item>
      <Setup.Item label="pusho pushes the current branch to origin and sets its upstream">
        <CommandBlock command="git pusho" />
      </Setup.Item>
      <Setup.Item label="pullm pulls with rebase from master, or main if master does not exist">
        <CommandBlock command="git pullm" />
      </Setup.Item>
    </Setup.Item>
  );
};
