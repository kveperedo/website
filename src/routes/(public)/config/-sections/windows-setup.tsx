import { CommandBlock } from "../-components/command-block";
import { Setup } from "../-components/setup";
import { ChromeSetup, VSCodeSetup } from "./common-app-setup";
import { JetbrainsFontSetup, NVMSetup, ZshSetup } from "./common-config-setup";

export const WindowsSetup = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-mono text-2xl font-medium text-foreground">windows setup</h2>
      </div>

      <div className="space-y-12">
        <Setup.Root title="Applications">
          <VSCodeSetup />
          <ChromeSetup />
          <Setup.Item
            label={
              <>
                Raycast
                <Setup.Dash />
                <Setup.Link href="https://www.raycast.com/" />
              </>
            }
          >
            <Setup.Item
              label={<Setup.Link href="/raycast-windows.rayconfig">Configuration file</Setup.Link>}
            />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                PowerToys
                <Setup.Dash />
                <Setup.Link href="https://learn.microsoft.com/en-us/windows/powertoys/" />
              </>
            }
          >
            <Setup.Item label={<Setup.Link href="/powertoys.ptb">Configuration file</Setup.Link>} />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                Spotify
                <Setup.Dash />
                <Setup.Link href="https://www.spotify.com/de-en/download/windows/" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                Steam
                <Setup.Dash />
                <Setup.Link href="https://store.steampowered.com/about/" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                Qbittorrent
                <Setup.Dash />
                <Setup.Link href="https://www.qbittorrent.org/" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                WinRAR
                <Setup.Dash />
                <Setup.Link href="https://www.win-rar.com/start.html?&L=0" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                Winhance
                <Setup.Dash />
                <Setup.Link href="https://winhance.net/" />
              </>
            }
          >
            <Setup.Item label="Use all recommended settings" />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                Fladder
                <Setup.Dash />
                <Setup.Link href="https://github.com/DonutWare/Fladder" />
              </>
            }
          />
        </Setup.Root>

        <Setup.Root title="Config">
          <Setup.Item
            label={
              <>
                WSL2
                <Setup.Dash />
                <Setup.Link href="https://learn.microsoft.com/en-us/windows/wsl/install" />
              </>
            }
          >
            <Setup.Item label="Install WSL2">
              <CommandBlock command="wsl --install" />
            </Setup.Item>
            <Setup.Item label="Install Ubuntu">
              <CommandBlock command="wsl.exe --install -d Ubuntu" />
            </Setup.Item>
            <Setup.Item label="Configure WSL2 for VS Code" />
          </Setup.Item>
          <JetbrainsFontSetup />
          <ZshSetup />
          <NVMSetup />
          <Setup.Item label="Remove windows snapping">
            <Setup.Item label="Settings → System → Multitasking → Turn Snap windows OFF" />
          </Setup.Item>
        </Setup.Root>
      </div>
    </div>
  );
};
