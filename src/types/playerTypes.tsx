
export interface PlayerParts {
    motor: number;   
    spray: number;   
    engrenagem: number; 
}

export interface CarUpgrades {
    motor: {
        speedLevel: number;
        accelerationLevel: number;
        jumpPowerLevel: number;
    };
    spray: {
        rarityLevel: number;
        unlockedSkins: string[];
    };
    engrenagem: {
        defenseLevel: number;
    };
}

export interface PlayerProfile {
    id: string;
    username: string;
    trophies: number;
    parts: PlayerParts;
    garage: Record<string, CarUpgrades>; 
}