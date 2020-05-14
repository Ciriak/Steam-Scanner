export default interface ISteamShortcut {
    AllowDesktopConfig: boolean;
    AllowOverlay: boolean;
    appname: string;
    Devkit: boolean;
    DevkitGameID: string;
    exe: string;
    icon: string;
    IsHidden: boolean;
    LastPlayTime: number;
    LaunchOptions: "",
    OpenVR: boolean;
    ShortcutPath: string;
    StartDir: string;
    tags: string[];
}