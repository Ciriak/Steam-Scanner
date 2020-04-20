/**
 * Represent a game that has been identified
 */
interface IGame {
  /**
   * Name of the game
   */
  name: string;
  /**
   * Name of the folder (if different of the game name itself)
   */
  folderName?: string;
  /**
   * List of game executable
   * if there is more than one, the scanner will try to determine which one is the main one
   * If there is only one, it it the main executable
   */
  binaries: string[];
  /**
   * Name of the launcher associated to this game
   */
  launcher: string;
  /**
   * Path to the folder containing the game files
   */
  folderPath: string;
  /**
   * Collection of path to the icon files
   */
  iconPath?: {
    16: string;
    32: string;
  };
  /**
   * Tell if the game binary has been found and set
   */
  binarySet?: boolean;
  /**
   * True if the binary has been manually set by the user, the scanner won't override it
   */
  userSet?: boolean;

  /**
   * If true, the game won't appear
   */
  hidden?: boolean;
}
