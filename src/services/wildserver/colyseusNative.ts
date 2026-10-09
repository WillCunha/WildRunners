import { Client } from '@colyseus/sdk';

export { Client };

export type ClientInstance =
    InstanceType<typeof Client>;

export type {
    Room
} from '@colyseus/sdk';
