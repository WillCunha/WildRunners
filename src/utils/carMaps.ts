export const carMaps = {
    // ==========================================
    // NÍVEL 1: Veículos Iniciais
    // ==========================================
    buggy: {
        icone: require('@/assets/images/cars/carroceria/buggy/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/buggy/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/buggy/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/buggy/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 129, y: 11 },
                rodaTras: { x: 48, y: 11 },
                size: { width: 50, height: 50 },
            },

            oficina: {
                rodaFrente: { x: 231.5, y: -5 },
                rodaTras: { x: 70, y: -3 },
                size: { width: 55, height: 50 },
            },

            loja: {
                rodaFrente: { x: 231.5, y: -5 },
                rodaTras: { x: 70, y: -3 },
                size: { width: 55, height: 50 },
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/kombi/brancoCima.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/kombi/brancoBaixo.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/kombi/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 129, y: 3 },
                rodaTras: { x: 43, y: 3 },
                size: { width: 45, height: 45 },
            },

            oficina: {
                rodaFrente: { x: 237, y: -17 },
                rodaTras: { x: 63, y: -17 },
                size: { width: 45, height: 45 },
            },

            loja: {
                rodaFrente: { x: 237, y: -17 },
                rodaTras: { x: 63, y: -17 },
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/uno/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/uno/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/uno/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 131, y: 11 },
                rodaTras: { x: 44.7, y: 11 },
                size: { width: 50, height: 50 },
            },

            oficina: {
                rodaFrente: { x: 234, y: -5 },
                rodaTras: { x: 62, y: -5 },
                size: { width: 55, height: 50 },
            },

            loja: {
                rodaFrente: { x: 234, y: -5 },
                rodaTras: { x: 62, y: -5 },
                size: { width: 55, height: 50 },
            },
        },
        tier: 1,
        stats: {
            speed: { base: 130, maxUpgrade: 180 },
            acceleration: { base: 75, maxUpgrade: 110 }
        }
    },
    fusca: {
        icone: require('@/assets/images/cars/carroceria/fusca/icon.png'),
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/fusca/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/fusca/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/fusca/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 141, y: 8 },
                rodaTras: { x: 41, y: 8 },
                size: { width: 57, height: 57 },
            },

            oficina: {
                rodaFrente: { x: 168, y: -3.5 },
                rodaTras: { x: 37.5, y: -3.5 },
                size: { width: 65, height: 65 },
            },

            loja: {
                rodaFrente: { x: 252, y: -14 },
                rodaTras: { x: 52, y: -14 },
                size: { width: 60, height: 60 },
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/astor/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/astor/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/astor/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 128, y: 10 },
                rodaTras: { x: 45, y: 12 },
                size: { width: 55, height: 55 },
            },

            oficina: {
                rodaFrente: { x: 185, y: 1 },
                rodaTras: { x: 60, y: 1 },
                size: { width: 65, height: 65 },
            },

            loja: {
                rodaFrente: { x: 228, y: -14 },
                rodaTras: { x: 65, y: -14 },
                size: { width: 50, height: 50 },
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/caravana/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/caravana/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/caravana/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 120, y: 12 },
                rodaTras: { x: 131, y: 12 },
                size: { width: 35, height: 35 },
            },
            oficina: {
                rodaFrente: { x: 185, y: 1 },
                rodaTras: { x: 60, y: 1 },
                size: { width: 35, height: 35 },
            },
            loja: {
                rodaFrente: { x: 185, y: 1 },
                rodaTras: { x: 60, y: 1 },
                size: { width: 35, height: 35 },
            }
        },
        tier: 3,
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/ferrari/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/ferrari/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/ferrari/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),

        wheels: {
            mapa: {
                rodaFrente: { x: 134.5, y: 18 },
                rodaTras: { x: 30.5, y: 18 },
                size: { width: 60, height: 60 },
            },

            oficina: {
                rodaFrente: { x: 171, y: 0 },
                rodaTras: { x: 19, y: 0 },
                size: { width: 65, height: 65 },
            },

            loja: {
                rodaFrente: { x: 236, y: 0 },
                rodaTras: { x: 28.5, y: 0 },
                size: { width: 65, height: 65 },
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
        corpoBrancoFrente: require('@/assets/images/cars/carroceria/monster/brancoFrente.png'),
        corpoBrancoTras: require('@/assets/images/cars/carroceria/monster/brancoTras.png'),
        corpoTransparente: require('@/assets/images/cars/carroceria/monster/transparent.png'),
        baseSize: { width: 350, height: 120 },
        wheelImage: require('@/assets/images/cars/rodas/rodas_padrao.png'),
        wheels: {
            mapa: {
                rodaFrente: { x: 131, y: 10 },
                rodaTras: { x: 43, y:  10 },
                size: { width: 55, height: 55 },
            },

            oficina: {
                rodaFrente: { x: 140, y: -30 },
                rodaTras: { x: 60, y: -30 },
                size: { width: 65, height: 65 },
            },

            loja: {
                rodaFrente: { x: 234, y: -14 },
                rodaTras: { x: 58, y: -14 },
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