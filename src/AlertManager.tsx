import React from 'react';
import { GameEvent } from 'aliceandbob-client';
import ReactHowler from 'react-howler';
import {PlayerEvent} from './GameStateRenderer';

import { memo } from 'react';

interface AlertManagerProps {
    event: PlayerEvent;
    digest: string;
}

function alertsAreEqual(prevAlert: AlertManagerProps, nextAlert: AlertManagerProps) {
    const isEqual = prevAlert.event.type === nextAlert.event.type && prevAlert.digest === nextAlert.digest;
    // console.log("alertsAreEqual: " + JSON.stringify(prevAlert) + " " + JSON.stringify(nextAlert) + " " + (isEqual ? "true" : "false"));
    return isEqual;
}

function eventToSound(event: PlayerEvent): string | null {
    const alert = event.type;
    if (alert === GameEvent.AddBetEvent) {
        return "/sounds/chips.wav";
    } else if (alert === GameEvent.AddPlayerEvent) {
        return "/sounds/old-cash-register.mp3";
    // } else if (alert === GameEvent.RevealEvent) {
    //     return "/sounds/card.wav";
    } else if (alert === GameEvent.AddDecryptEvent) {
        if (event.values.complete) {
            return "/sounds/card.wav";
        }
        else {
            return null;
        }
    } else if (alert === GameEvent.PayoutEvent) {
        return "/sounds/mario-coin.mp3";
    } else if (alert === GameEvent.AddCheckEvent) {
        return "/sounds/check.mp3";
    } else if (alert === GameEvent.AddFoldEvent) {
        return "/sounds/fold.mp3";
    } else {
        return null;
    }
}

const AlertManager: React.FC<AlertManagerProps> = ({
    event,
    digest
}) => {
    // console.log("AlertManager: " + alert + " " + digest);

    // const sound = ALERT_TYPE_TO_SOUND[alert];
    const sound = eventToSound(event);
    // assert!(sound, "AlertManager: sound is null");
    console.log('sound: ' + sound);
    if (event && sound) {
        return (
            <div className='alert-manager' >
            <ReactHowler
                src={sound}
                playing={true}
            />
            </div>
        );
    } else {    
        return (
            <div></div>
        );
    }
};


const MemoizedAlertManager = memo(AlertManager, alertsAreEqual);

export default MemoizedAlertManager;

export type { AlertManagerProps };