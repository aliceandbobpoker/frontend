// src/GameBackdrop.tsx

import {Action, ActionType} from 'aliceandbob-client';

export const parseAction = (action: Action, awaitingApproval: boolean) => {
  if (awaitingApproval) {
    switch (action.type) {
      case ActionType.SHUFFLE:
        return "Please approve shuffle";
      case ActionType.DECRYPT:
        return "Please approve decryption";
        case ActionType.DECRYPT_MANY:
          return "Please approve decryption";
      case ActionType.BET:
        return "Please approve bet";
      case ActionType.BLIND_BET:
        return "Please approve blind bet";
    }
  }
  else {
    switch (action.type) {
      case ActionType.SHUFFLE:
        return "Shuffling cards";
      case ActionType.DECRYPT:
        return "Decrypting cards";
        case ActionType.DECRYPT_MANY:
          return "Decrypting cards";
      case ActionType.BET:
        return "Placing bet";
      case ActionType.BLIND_BET:
        return "Placing blind bet";
    }
  }
}