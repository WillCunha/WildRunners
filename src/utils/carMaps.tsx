export const carMaps = {
    // ==========================================
    // NÍVEL 1: Veículos Iniciais
    // ==========================================
    // buggy: {
    //     corpoBrancoFrente: require('@/assets/images/cars/carroceria/buggy/brancoFrente.png'),
    //     corpoTransparente: require('@/assets/images/cars/carroceria/buggy/transparent.png'),
    //     baseSize: { width: 350, height: 120 },
    //     wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
    //     rodaFrente: { x: 168.5, y: 0 },
    //     rodaTras: { x: 49, y: 0 },
    //     size: { width: 40, height: 40 },
    //     offset: {
    //         frente: { x: 90, y: 13 },
    //         tras: { x: 43, y: 13 }
    //     },
    //     tier: 1,
    //     stats: {
    //         speed: { base: 100, maxUpgrade: 140 },
    //         acceleration: { base: 50, maxUpgrade: 80 }
    //     }
    // },
    kombi: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/kombi/brancoCima.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/kombi/brancoBaixo.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/kombi/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 169, y: -11 },
        rodaTras: { x: 43, y: -11 },
        size: { width: 40, height: 40 },
        offset: {
            frente: { x: 90, y: 12 },
            tras: { x: 45, y: 12 }
        },
        tier: 1,
        stats: {
            speed: { base: 90, maxUpgrade: 135 },
            acceleration: { base: 55, maxUpgrade: 85 }
        }
    },

    // ==========================================
    // NÍVEL 2: Veículos Intermediários
    // ==========================================
    uno: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/uno/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/uno/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/uno/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 171, y: 1 },
        rodaTras: { x: 45, y: 1 },
        size: { width: 40, height: 40 },
        offset: {
            frente: { x: 91, y: 12 },
            tras: { x: 45, y: 12 }
        },
        tier: 1,
        stats: {
            speed: { base: 130, maxUpgrade: 180 },
            acceleration: { base: 75, maxUpgrade: 110 }
        }
    },
    fusca: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/fusca/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/fusca/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/fusca/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 186, y: -3.5 },
        rodaTras: { x: 37.5, y: -3.5 },
        size: { width: 42, height: 42 },
        offset: {
            frente: { x: 96, y: 12 },     
            tras: { x: 43, y: 12 } 
        },
        tier: 2,
        stats: {
            speed: { base: 125, maxUpgrade: 175 },
            acceleration: { base: 80, maxUpgrade: 115 }
        }
    },

    // ==========================================
    // NÍVEL 3: Veículos Avançados
    // ==========================================
    astor: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/astor/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/astor/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/astor/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 185, y: 1 },
        rodaTras: { x: 60, y: 1 },
        size: { width: 35, height: 35 },
        offset: {
            frente: { x: 120, y: 12 },    
            tras: { x: 131, y: 12 }  
        },
        tier: 3,
        stats: {
            speed: { base: 170, maxUpgrade: 230 },
            acceleration: { base: 100, maxUpgrade: 150 }
        }
    },
    caravana: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/caravana/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/caravana/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/caravana/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 185, y: 1 },
        rodaTras: { x: 60, y: 1 },
        size: { width: 35, height: 35 },
        offset: {
            frente: { x: 120, y: 12 },    
            tras: { x: 131, y: 12 }  
        },
        tier: 3,
        stats: {
            speed: { base: 165, maxUpgrade: 225 },
            acceleration: { base: 105, maxUpgrade: 155 }
        }
    },

    // ==========================================
    // NÍVEL 4: Veículos Especiais / Endgame
    // ==========================================
    ferrari: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/ferrari/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/ferrari/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/ferrari/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 171, y: 0 },
        rodaTras: { x: 19, y: 0 },
        size: { width: 50, height: 50 },
        offset: {
            frente: { x: 98, y: 25 },     
            tras: { x: 42, y: 25 } 
        },
        tier: 4,
        stats: {
            speed: { base: 220, maxUpgrade: 300 },
            acceleration: { base: 140, maxUpgrade: 200 }
        }
    },
    monster: {
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/monster/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/monster/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/monster/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        rodaFrente: { x: 293, y: 41 },
        rodaTras: { x: 171, y: 43 },
        size: { width: 35, height: 35 },
        offset: {
              frente: { x: -156, y: -83 },
            tras: { x: -129, y: -85 }
        },
        tier: 4,
        stats: {
            speed: { base: 200, maxUpgrade: 280 },
            acceleration: { base: 160, maxUpgrade: 220 } // Monster tem mais torque/aceleração
        }
    }
};