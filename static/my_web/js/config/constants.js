const CONSTANTS = {
  VERSION: '1.1.0',
  INITIAL_CREDITS: 10000,
  INITIAL_CARGO: 100,
  INITIAL_FUEL: 100,
  MAX_FUEL: 200,
  INITIAL_HULL: 100,
  INITIAL_SHIELD: 100,
  FUEL_PER_DISTANCE: 0.5,
  TRADE_FEE_RATE: 0.01,
  PRICE_FLUCTUATION: 0.3,
  AUTO_SAVE_INTERVAL: 5000,
  GAME_TICK_INTERVAL: 1000,
  DAYS_PER_TICK: 0.1,
  MAX_CARGO_LEVEL: 10,
  MAX_ENGINE_LEVEL: 10,
  MAX_SHIELD_LEVEL: 10,
  MAX_WEAPON_LEVEL: 10,
  UPGRADE_BASE_COST: {
    cargo: 1000,
    engine: 1500,
    shield: 1200,
    weapon: 2000
  },
  UPGRADE_COST_MULTIPLIER: 1.8,
  STORAGE_KEYS: {
    SAVE: 'galaxy_trader_save',
    SETTINGS: 'galaxy_trader_settings',
    VERSION: 'galaxy_trader_version'
  },
  EVENTS: {
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_SAVE: 'game:save',
    GAME_LOAD: 'game:load',
    GAME_TICK: 'game:tick',
    NAVIGATE_START: 'navigate:start',
    NAVIGATE_COMPLETE: 'navigate:complete',
    NAVIGATE_CANCEL: 'navigate:cancel',
    TRADE_BUY: 'trade:buy',
    TRADE_SELL: 'trade:sell',
    PRICE_UPDATE: 'price:update',
    UPGRADE_PURCHASE: 'upgrade:purchase',
    INVESTMENT_START: 'investment:start',
    INVESTMENT_COMPLETE: 'investment:complete',
    RANDOM_EVENT_TRIGGER: 'event:trigger',
    RANDOM_EVENT_RESOLVE: 'event:resolve',
    UI_THEME_CHANGE: 'ui:theme:change',
    UI_VIEW_CHANGE: 'ui:view:change',
    UI_NOTIFICATION: 'ui:notification',
    AI_TRADE: 'ai:trade',
    AI_NAVIGATE: 'ai:navigate'
  },
  VIEWS: {
    MAP: 'map',
    TRADE: 'trade',
    UPGRADE: 'upgrade',
    INVESTMENT: 'investment',
    LEADERBOARD: 'leaderboard',
    SETTINGS: 'settings'
  },
  THEMES: {
    SCI_FI: 'sci-fi',
    WASTELAND: 'wasteland'
  },
  EVENT_PROBABILITIES: {
    PIRATE: 0.10,
    RUINS: 0.05,
    TRADE_BAN: 0.08,
    MARKET_CRASH: 0.15,
    LUCKY: 0.07,
    FUEL_LEAK: 0.05
  }
};
