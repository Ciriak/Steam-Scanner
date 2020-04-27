export interface IGamesLibrary {
  /**
   * Name of the folder known for containing this game
   */
  [folderName: string]: {
    [prop: string]: any;
    /**
     * Possible binaries for the game
     */
    binaries: string[],
    /**
     * Label for this game
     */
    label?: string;
  }
}

/**
 * Represent a game that has been identified
 */
export default interface IGame {
  [prop: string]: any;
  /**
   * Name of the game
   */
  name: string;

  /**
   * Label of the game
   *
   * Name will be reused by default
   */
  label: string;

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
   * True if the game should not display notifications
   * Can be set to false if it is a game that has been previously "removed" or reset
   */
  hideNotifications?: boolean;

  /**
   * True if the game shouldn't be added automatically (if there only one exe for example)
   */
  disableAutoAdd?: boolean;

  /**
   * If true, the game won't appear
   */
  hidden?: boolean;
}
