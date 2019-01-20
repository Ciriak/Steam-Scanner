interface ILauncher {
  name: string;
  binaryName?: string;
  binaryLocation?: string;

  /**
   * List of games found for this launcher
   */
  games: IGame[];
  binaryPossibleLocations?: string[];
  gamesPossibleLocations?: string[];
}
