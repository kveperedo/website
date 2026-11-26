import { CommandBlock } from "../components/command-block";
import { PromptBlock } from "../components/prompt-block";
import { Setup } from "../components/setup";
import { SetupCommands } from "../components/setup-commands";

const FONT_PROMPT =
    "Install JetBrains Mono Nerd Font from nerdfonts.com so the terminal can render Powerlevel10k glyphs.";

const ZSH_PROMPT =
    'Set zsh as my default shell, then install Oh My Zsh with the Powerlevel10k theme, zsh-autosuggestions, and zsh-syntax-highlighting. Set ZSH_THEME="powerlevel10k/powerlevel10k" and plugins=(git zsh-autosuggestions zsh-syntax-highlighting) in ~/.zshrc, then reload it.';

const NVM_PROMPT =
    "Install nvm with its install script, then use it to install the latest Node version and switch to it.";

export const JetbrainsFontSetup = () => {
    return (
        <Setup.Item
            label={
                <>
                    JetBrains Mono Nerd Font <Setup.Dash />
                    <Setup.Link href="https://www.nerdfonts.com/font-downloads" />
                </>
            }
        >
            <PromptBlock prompt={FONT_PROMPT} />
        </Setup.Item>
    );
};

export const ZshSetup = () => {
    return (
        <Setup.Item label="Zsh and Oh My Zsh">
            <PromptBlock prompt={ZSH_PROMPT} />
            <SetupCommands>
                <CommandBlock
                    command={`# Change default shell to zsh
chsh -s $(which zsh)

# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install the Powerlevel10k theme
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \\
\${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k

# Install zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions \\
\${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Install zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \\
\${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Edit .zshrc
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

# Reload Zsh
source ~/.zshrc`}
                />
            </SetupCommands>
        </Setup.Item>
    );
};

export const NVMSetup = () => {
    return (
        <Setup.Item label="NVM">
            <PromptBlock prompt={NVM_PROMPT} />
            <SetupCommands>
                <CommandBlock
                    command={`# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

# Install the latest Node version
nvm install node
nvm use node`}
                />
            </SetupCommands>
        </Setup.Item>
    );
};
