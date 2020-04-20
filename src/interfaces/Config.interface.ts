import launchers from "../library/LaunchersList";

export default interface IConfig {
  steamDirectory: string;
  launchers: typeof launchers;
  launchOnStartup: boolean;
  enableNotifications: boolean;
}
