import { CommandBlock } from "../components/command-block";
import { Setup } from "../components/setup";

export const JetbrainsFontSetup = () => {
  return (
    <Setup.Item
      label={
        <>
          JetBrains Mono Nerd Font <Setup.Dash />
          <Setup.Link href="https://www.nerdfonts.com/font-downloads" />
        </>
      }
    />
  );
};

export const ZshSetup = () => {
  return (
    <Setup.Item label="Zsh and Oh My Zsh">
      <Setup.Item label="Change default shell to zsh">
        <CommandBlock command="chsh -s $(which zsh)" />
      </Setup.Item>
      <Setup.Item label="Install oh-my-zsh">
        <CommandBlock
          command={`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`}
        />
      </Setup.Item>
      <Setup.Item label="Install the Powerlevel10k theme">
        <CommandBlock
          command="git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
        />
      </Setup.Item>
      <Setup.Item label="Install zsh-autosuggestions">
        <CommandBlock
          command="git clone https://github.com/zsh-users/zsh-autosuggestions \
${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
        />
      </Setup.Item>
      <Setup.Item label="Install zsh-syntax-highlighting">
        <CommandBlock
          command="git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \
${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
        />
      </Setup.Item>
      <Setup.Item label="Edit .zshrc file">
        <CommandBlock
          command={`ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)`}
        />
      </Setup.Item>
      <Setup.Item label="Reload Zsh">
        <CommandBlock command="source ~/.zshrc" />
      </Setup.Item>
    </Setup.Item>
  );
};

export const NVMSetup = () => {
  return (
    <Setup.Item label="NVM">
      <Setup.Item label="Install NVM">
        <CommandBlock command="curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash" />
      </Setup.Item>
      <Setup.Item label="Install latest node version">
        <CommandBlock
          command={`nvm install node
nvm use node`}
        />
      </Setup.Item>
    </Setup.Item>
  );
};
