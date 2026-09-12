export const carMaps = {
    // ==========================================
    // NÍVEL 1: Veículos Iniciais
    // ==========================================
    buggy: {
        icone: require('@/assets/images/cars/carroceria/buggy/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/buggy/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/buggy/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/buggy/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 114, y: 7 },
                rodaTras: { x: 53, y: 7 },
                size: { width: 40, height: 40 },
            },

            oficina: {
                 rodaFrente: { x: 210, y: -5 },
                rodaTras: { x: 88, y: -3 },
                size: { width: 40, height: 40 },
            },

            loja: {
                rodaFrente: { x: 210, y: -5 },
                rodaTras: { x: 88, y: -3 },
                size: { width: 40, height: 40 },
            },
        },
        tier: 1,
        stats: {
            speed: { base: 100, maxUpgrade: 140 },
            acceleration: { base: 50, maxUpgrade: 80 }
        }
    },
    kombi: {
        icone: require('@/assets/images/cars/carroceria/kombi/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/kombi/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/kombi/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/kombi/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 125, y: 3 },
                rodaTras: { x: 39, y: 3 },
                size: { width: 50, height: 55 },
            },

            oficina: {
                 rodaFrente: { x: 227, y: -15 },
                rodaTras: { x: 57, y: -15 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 227, y: -15 },
                rodaTras: { x: 57, y: -15 },
                size: { width: 45, height: 45 },
            },
        },
        tier: 1,
        stats: {
            speed: { base: 90, maxUpgrade: 135 },
            acceleration: { base: 55, maxUpgrade: 85 }
        }
    },

    // ==========================================
    // NÍVEL 3: Veículos Intermediários
    // ==========================================
    uno: {
        icone: require('@/assets/images/cars/carroceria/uno/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/uno/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/uno/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/uno/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 133, y: 7 },
                rodaTras: { x: 40.5, y: 7 },
                size: { width: 50, height: 50 },
            },

            oficina: {
                rodaFrente: { x: 243, y: -8 },
                rodaTras: { x: 59, y: -8 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 243, y: -8 },
                rodaTras: { x: 59, y: -8 },
                size: { width: 45, height: 45 },
            },
        },
        tier: 3,
        stats: {
            speed: { base: 130, maxUpgrade: 180 },
            acceleration: { base: 75, maxUpgrade: 110 }
        }
    },
    fusca: {
        icone: require('@/assets/images/cars/carroceria/fusca/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/fusca/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/fusca/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/fusca/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 139, y: 8 },
                rodaTras: { x: 40, y: 8 },
                size: { width: 55, height: 55 },
            },

            oficina: {
                rodaFrente: { x: 255, y: -7 },
                rodaTras: { x: 55, y: -7 },
                size: { width: 50, height: 50 },
            },

            loja: {
                rodaFrente: { x: 255, y: -7 },
                rodaTras: { x: 55, y: -7 },
                size: { width: 50, height: 50 },
            },
        },
        tier: 3,
        stats: {
            speed: { base: 125, maxUpgrade: 175 },
            acceleration: { base: 80, maxUpgrade: 115 }
        }
    },

    // ==========================================
    // NÍVEL 5: Veículos Avançados
    // ==========================================
    astor: {
        icone: require('@/assets/images/cars/carroceria/astor/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/astor/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/astor/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/astor/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 122, y: 4 },
                rodaTras: { x: 44, y: 5 },
                size: { width: 45, height: 45 },
            },

            oficina: {
                rodaFrente: { x: 219.5, y: -14 },
                rodaTras: { x: 65.5, y: -14 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 219.5, y: -14 },
                rodaTras: { x: 65.5, y: -14 },
                size: { width: 45, height: 45 },
            },
        },
        tier: 5,
        stats: {
            speed: { base: 170, maxUpgrade: 230 },
            acceleration: { base: 100, maxUpgrade: 150 }
        }
    },
    caravana: {
        icone: require('@/assets/images/cars/carroceria/caravana/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/caravana/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/caravana/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/caravana/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 133, y: 11 },
                rodaTras: { x: 40.5, y: 11 },
                size: { width: 50, height: 50 },
            },
            oficina: {
                rodaFrente: { x: 242, y: -3 },
                rodaTras: { x: 57.5, y: -3 },
                size: { width: 48, height: 48 },
            },
            loja: {
                rodaFrente: { x: 242, y: -3 },
                rodaTras: { x: 57.5, y: -3 },
                size: { width: 48, height: 48 },
            }
        },
        tier: 5,
        stats: {
            speed: { base: 165, maxUpgrade: 225 },
            acceleration: { base: 105, maxUpgrade: 155 }
        }
    },

    // ==========================================
    // NÍVEL 8: Veículos Especiais / Endgame
    // ==========================================
    ferrari: {
        icone: require('@/assets/images/cars/carroceria/ferrari/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/ferrari/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/ferrari/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/ferrari/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 125, y: 7 },
                rodaTras: { x: 37, y: 7 },
                size: { width: 45, height: 45 },
            },

            oficina: {
                 rodaFrente: { x: 225, y: -10 },
                rodaTras: { x: 51, y: -9 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 225, y: -10 },
                rodaTras: { x: 51, y: -9 },
                size: { width: 45, height: 45 },
            },
        },
        tier: 8,
        stats: {
            speed: { base: 220, maxUpgrade: 300 },
            acceleration: { base: 140, maxUpgrade: 200 }
        }
    },
    lamborghini: {
        icone: require('@/assets/images/cars/carroceria/lamborghini/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/lamborghini/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/lamborghini/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/lamborghini/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 126.5, y: 7 },
                rodaTras: { x: 42, y: 9 },
                size: { width: 43, height: 43 },
            },

            oficina: {
                rodaFrente: { x: 230, y: -10 },
                rodaTras: { x: 60, y: -10 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 230, y: -10 },
                rodaTras: { x: 60, y: -10 },
                size: { width: 45, height: 45 },
            },
        },
        tier: 8,
        stats: {
            speed: { base: 220, maxUpgrade: 300 },
            acceleration: { base: 140, maxUpgrade: 200 }
        }
    },
    monster: {
        icone: require('@/assets/images/cars/carroceria/monster/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/monster/primary.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/monster/secondary.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/monster/components.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 137, y: 8 },
                rodaTras: { x: 40, y:  10 },
                size: { width: 55, height: 55 },
            },

            oficina: {
                rodaFrente: { x: 247, y: -14 },
                rodaTras: { x: 54, y: -14 },
                size: { width: 55, height: 55 },
            },

            loja: {
                rodaFrente: { x: 247, y: -14 },
                rodaTras: { x: 54, y: -14 },
                size: { width: 55, height: 55 },
            },
        },
        tier: 8,
        stats: {
            speed: { base: 200, maxUpgrade: 280 },
            acceleration: { base: 160, maxUpgrade: 220 } // Monster tem mais torque/aceleração
        }
    }
};