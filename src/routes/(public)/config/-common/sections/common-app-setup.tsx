import { Setup } from "../components/setup";

export const VSCodeSetup = () => (
  <Setup.Item
    label={
      <>
        Visual Studio Code
        <Setup.Dash />
        <Setup.Link href="https://code.visualstudio.com/" />
      </>
    }
  />
);

export const ChromeSetup = () => (
  <Setup.Item
    label={
      <>
        Google Chrome
        <Setup.Dash />
        <Setup.Link href="https://www.google.com/intl/en_ph/chrome/" />
      </>
    }
  />
);
