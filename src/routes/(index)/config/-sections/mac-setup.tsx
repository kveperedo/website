import { Setup } from "../-components/setup";
import { ChromeSetup, VSCodeSetup } from "./common-app-setup";
import { JetbrainsFontSetup, NVMSetup, ZshSetup } from "./common-config-setup";

export const MacSetup = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
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
              label={
                <Setup.Link href="/raycast-mac.rayconfig" download>
                  Configuration file
                </Setup.Link>
              }
            />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                Velja
                <Setup.Dash />
                <Setup.Link href="https://sindresorhus.com/velja" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                BetterTouchTool
                <Setup.Dash />
                <Setup.Link href="https://folivora.ai/" />
              </>
            }
          >
            <Setup.Item
              label={
                <Setup.Link href="/btt.bttpreset" download>
                  Configuration file
                </Setup.Link>
              }
            />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                CleanShot X
                <Setup.Dash />
                <Setup.Link href="https://cleanshot.com/" />
              </>
            }
          />
          <Setup.Item
            label={
              <>
                Hyper Key
                <Setup.Dash />
                <Setup.Link href="https://hyperkey.app/" />
              </>
            }
          >
            <Setup.Item label='Unselect "Include shift in hyper key"' />
          </Setup.Item>
          <Setup.Item
            label={
              <>
                Scroll Reverser
                <Setup.Dash />
                <Setup.Link href="https://pilotmoon.com/scrollreverser/" />
              </>
            }
          />
        </Setup.Root>

        <Setup.Root title="Config">
          <JetbrainsFontSetup />
          <ZshSetup />
          <NVMSetup />
          <Setup.Item
            label={
              <>
                Setup SSH for Github
                <Setup.Dash />
                <Setup.Link href="https://chat.openai.com/" />
              </>
            }
          ></Setup.Item>
        </Setup.Root>
      </div>
    </div>
  );
};
