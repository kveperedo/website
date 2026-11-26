import { CommandBlock } from "../components/command-block";
import { PromptBlock } from "../components/prompt-block";
import { Setup } from "../components/setup";
import { SetupCommands } from "../components/setup-commands";

const WORKTRUNK_PROMPT =
    "Install worktrunk with Homebrew, install its zsh shell integration, and install the OpenCode activity plugin. Add a wtc alias to ~/.zshrc that creates a worktree from the default branch, and include the commands for creating, switching, listing, and removing worktrees. In ~/.config/worktrunk/config.toml, add a post-start hook that runs `wt step copy-ignored` to copy gitignored files into new worktrees, and exclude node_modules/ from the copy since pnpm rebuilds it from its store.";

const GIT_PROMPT =
    "Add pusho and pullm aliases to ~/.gitconfig. pusho pushes the current branch to origin and sets its upstream; pullm pulls with rebase from master, or main if master does not exist. Also set up SSH authentication for GitHub.";

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
            <PromptBlock prompt={WORKTRUNK_PROMPT} />
            <SetupCommands>
                <CommandBlock
                    command={`# Install worktrunk
brew install worktrunk

# Install shell integration
wt config shell install
if command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi

# Install the OpenCode activity plugin
wt config plugins opencode install

# Create and switch worktrees
wt switch --create <branch>
wt switch <branch>
wt list
wt remove

# Add a wtc alias to .zshrc
alias wtc="wt switch --base=^ -c"

# wtc creates a new worktree from the default branch
wtc <branch>`}
                />
                <CommandBlock
                    language="~/.config/worktrunk/config.toml"
                    command={`# Copy gitignored files (caches, .env) into new worktrees
[post-start]
copy = "wt step copy-ignored"

# pnpm rebuilds node_modules from its store
[step.copy-ignored]
exclude = ["node_modules/"]`}
                />
            </SetupCommands>
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
            <CommandBlock
                command={`# Install OpenCode
brew install opencode

# Start a session
opencode`}
            />
        </Setup.Item>
    );
};

export const GitSetup = () => {
    return (
        <Setup.Item label="Git">
            <PromptBlock prompt={GIT_PROMPT} />
            <SetupCommands>
                <CommandBlock
                    command={`# Add pusho and pullm aliases to ~/.gitconfig
[alias]
    pullm = "!f() { branch=master; git show-ref --verify --quiet refs/remotes/origin/master || branch=main; git pull --rebase origin \\"$branch\\"; }; f"
    pusho = push -u origin HEAD

# pusho pushes the current branch to origin and sets its upstream
git pusho

# pullm pulls with rebase from master, or main if master does not exist
git pullm`}
                />
            </SetupCommands>
            <Setup.Item
                label={
                    <>
                        Setup SSH for Github
                        <Setup.Dash />
                        <Setup.Link href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh" />
                    </>
                }
            />
        </Setup.Item>
    );
};
