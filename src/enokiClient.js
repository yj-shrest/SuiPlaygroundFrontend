import { EnokiClient } from '@mysten/enoki';

export const enokiClient = new EnokiClient({
  provider: {
    type: 'google',
    clientId: '123988858251-p26bres4afcg3j9jtb2d1ibs63j4r300.apps.googleusercontent.com',
  },
});

