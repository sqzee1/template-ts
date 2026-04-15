interface CharacterModel extends Model {
	Humanoid: Humanoid;
	HumanoidRootPart: Part;
	Head: Part;
}

interface Player extends Instance {
	PlayerScripts: PlayerScripts;
	PlayerGui: PlayerGui;
	Backpack: Backpack;
}

interface PlayerTemplate {
	Coins: number;
}
