/**
 * List of the executables that should **never** be used as the main game executable
 */
const exeBlackList: string[] = [
    "Cleanup.exe",
    "cleanup.exe",
    "vc_redist.x64.exe",
    "vc_redist.x86.exe",
    "vcredist_x64.exe",
    "crashmsg.exe",
    "crashhandler.exe",
    "vcredist_x86.exe",
    "vcredist120.exe",
    "vcredist120_x64.exe",
    "vcredist120_x86.exe",
    "DXSETUP.exe",
    "dxsetup.exe"
];

export default exeBlackList;