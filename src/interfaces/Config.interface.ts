import launchers from "../library/LaunchersList";

export default interface IConfig {
  steamDirectory: string;
  steamExe: string;
  launchers: typeof launchers;
  launchOnStartup: boolean;
  enableNotifications: boolean;
}
