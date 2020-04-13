import launchers from "../library/launchers/LaunchersList";

export default interface IConfig {
  steamDirectory: string;
  launchers: typeof launchers;
  launchOnStartup: boolean;
  enableNotifications: boolean;
}
