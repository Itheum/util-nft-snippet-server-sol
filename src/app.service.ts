import { Injectable } from '@nestjs/common';
import nacl from 'tweetnacl';
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from '@metaplex-foundation/umi';
import {
  createNft,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import testKey from '../kp.json';
import {
  MetadataArgsArgs,
  createTree,
  findLeafAssetIdPda,
  getAssetWithProof,
  mintToCollectionV1,
  mplBubblegum,
  transfer,
} from '@metaplex-foundation/mpl-bubblegum';
import { PublicKey } from '@solana/web3.js';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';

@Injectable()
export class AppService {
  testSignature() {
    const receivedSigT =
      'c1bb7ffed47eee0502325ffeffa27da23958c163fbe7a16bab0198a1df5efa431e92a256009eb3cba4167f2336bee8debde3359d2d88f1d144f4eb98ee40e401:MTQ4NToxNzIwOjI0MDA=';
    const signature = Buffer.from(receivedSigT.split(':')[0], 'hex');
    const message = Buffer.from(receivedSigT.split(':')[1]);
    const pubKey = new PublicKey(
      'At3pzpRWg4N3WSZoBZiNKLotzw4VHBSjLJVZejd3YXVL',
    ).toBytes();

    const result = nacl.sign.detached.verify(message, signature, pubKey);
    return result;
  }

  async createCollection() {
    const umi = createUmi('https://api.devnet.solana.com');
    umi.use(mplTokenMetadata());
    const testWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(testKey),
    );
    umi.use(keypairIdentity(testWallet));
    const collectionMint = generateSigner(umi);
    const resp = await createNft(umi, {
      mint: collectionMint,
      name: 'Itheum Get Bitz XP Dev',
      uri: 'https://ipfs.io/ipfs/QmTBeJHejL9awc5RA3u7TGWNv9RyGi2KgQUfzzdZstyz3n/',
      sellerFeeBasisPoints: percentAmount(5.1), // 5.1%
      isCollection: true,
    }).sendAndConfirm(umi);
    return resp;
  }

  async createMerkleTree() {
    const umi = createUmi('https://api.devnet.solana.com');
    umi.use(mplBubblegum());
    const testWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(testKey),
    );
    umi.use(keypairIdentity(testWallet));

    const merkleTree = generateSigner(umi);
    const builder = await createTree(umi, {
      merkleTree,
      maxDepth: 14,
      maxBufferSize: 64,
    });
    const resp = await builder.sendAndConfirm(umi);
    return resp;
  }

  async mintNft() {
    const umi = createUmi(
      'https://devnet.helius-rpc.com?api-key=3f6673bb-1f8b-461f-b4b1-935e474aaeba',
    );
    umi.use(mplBubblegum());
    const testWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(testKey),
    );
    umi.use(keypairIdentity(testWallet));
    const leafOwner1 = fromWeb3JsPublicKey(
      new PublicKey('At3pzpRWg4N3WSZoBZiNKLotzw4VHBSjLJVZejd3YXVL'),
    );
    const merkleTree = fromWeb3JsPublicKey(
      new PublicKey('6aZF3zzGosTmp9tzUpk8mP2e2E5GMCdnuT8wTbRQkVPt'),
    );
    const collectionMint = fromWeb3JsPublicKey(
      new PublicKey('6MgvQSDUU3Z2a5MQqPeStUyCo1AXrB8xJhyBc8YYH3uk'),
    );
    const metadata: MetadataArgsArgs = {
      name: 'GetBitzNFTunes - Music GIF',
      uri: 'https://indigo-complete-silverfish-271.mypinata.cloud/ipfs/QmcgwWW47d9FjHksKhZ5DWJYWvzPbVR1uhgH8kwBgNkJ9F/GetBitzNFTunesMainM.json',
      sellerFeeBasisPoints: 200,
      collection: { key: collectionMint, verified: false },
      creators: [
        { address: umi.identity.publicKey, verified: false, share: 100 },
      ],
    };
    const resp1 = await mintToCollectionV1(umi, {
      leafOwner: leafOwner1,
      merkleTree,
      collectionMint,
      metadata: metadata,
    }).sendAndConfirm(umi);
    return [resp1];
  }

  async fetchNft() {
    const umi = createUmi('https://api.devnet.solana.com');
    umi.use(dasApi());
    const merkleTree = fromWeb3JsPublicKey(
      new PublicKey('6aZF3zzGosTmp9tzUpk8mP2e2E5GMCdnuT8wTbRQkVPt'),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [assetId, bump] = await findLeafAssetIdPda(umi, {
      merkleTree,
      leafIndex: 0,
    });
    const rpcAsset = await umi.rpc.getAsset(assetId);
    return rpcAsset;
  }

  async fetchNftsForAddress() {
    const umi = createUmi('https://api.devnet.solana.com');
    umi.use(dasApi());
    const testWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(testKey),
    );
    umi.use(keypairIdentity(testWallet));

    const owner = fromWeb3JsPublicKey(
      new PublicKey('At3pzpRWg4N3WSZoBZiNKLotzw4VHBSjLJVZejd3YXVL'),
    );
    const rpcAsset = await umi.rpc.getAssetsByOwner({ owner });
    return rpcAsset;
  }

  async transferNft() {
    const umi = createUmi('https://api.devnet.solana.com');
    umi.use(dasApi());
    const testWallet = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(testKey),
    );
    umi.use(keypairIdentity(testWallet));
    const merkleTree = fromWeb3JsPublicKey(
      new PublicKey('6aZF3zzGosTmp9tzUpk8mP2e2E5GMCdnuT8wTbRQkVPt'),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [assetId, bump] = await findLeafAssetIdPda(umi, {
      merkleTree,
      leafIndex: 0,
    });

    const owner = fromWeb3JsPublicKey(
      new PublicKey('7VrS7fu6ERH6kVhLi1ELffpB46LkGuU6qDkyJ73u9oHj'),
    );
    const newOwner = fromWeb3JsPublicKey(
      new PublicKey('At3pzpRWg4N3WSZoBZiNKLotzw4VHBSjLJVZejd3YXVL'),
    );
    const assetWithProof = await getAssetWithProof(umi, assetId);
    const resp = await transfer(umi, {
      ...assetWithProof,
      leafOwner: owner,
      newLeafOwner: newOwner,
    }).sendAndConfirm(umi);
    return resp;
  }
}
