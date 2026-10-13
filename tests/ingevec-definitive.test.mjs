import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, lstatSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ECASA_NEW_SLUGS, ECASA_RETIRED_SLUGS, ECASA_SLUGS, restoreEcasaData, assertPortfolioData, assertPortfolioIndex, assertDefinitiveFicheFallback, assertCatalogueConsultPrices,
  assertCommercialBytes, restoreReviewedScope,
  PORTFOLIO_BASELINE, INGEVEC_REMOVED_SLUGS, INGEVEC_NEW_SLUGS, readCommercialFile } from './commercial-html.mjs';
import { projects as contextualProjects } from '../lib/project-context.mjs';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { evaluateProject } from '../assets/js/purchase-capacity.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = '8cdb9bf2af607a4f0822e5ea2c3ec4ba3f4c76b1';
const PREFIX = '/assets/propiedades/ingevec-preview/';
const WRONG_VIMA_IMAGE = '/assets/propiedades/catalogo/571b2a1740b3b5d4920157fa.webp';
const current = readCommercialFile;
const old = path => execFileSync('git', ['show', `${BASELINE}:${path}`], { cwd: ROOT });
const json = path => JSON.parse(current(path));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogue = json('data/proyectos.json');
const research = json('data/fichas-proyectos.json');
const manifest = json('data/brochures-ingevec.json');
const priorCatalogue = JSON.parse(old('data/proyectos.json'));
const priorManifest = JSON.parse(old('data/brochures-ingevec.json'));
const preview = page => page.replace(/<!--INGEVEC_PUBLIC_START-->[\s\S]*?<!--INGEVEC_PUBLIC_END-->/g, '');
const html = slug => current(slug + '.html').toString();
const visibleText = page => preview(page).replace(/<!--[\s\S]*?-->|<head\b[^>]*>[\s\S]*?<\/head>|<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>/g, ' ');
const section = (page, id) => {
  const match = preview(page).match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`));
  assert.ok(match, 'Missing section ' + id); return match[1];
};
const scripts = page => [...page.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match => match[0]);
const head = page => page.match(/<head\b[^>]*>[\s\S]*?<\/head>/)[0];
const embeds = page => [...page.matchAll(/(?:data-embed-src|src)="([^"]*(?:google\.com\/maps|matterport|kuula|360)[^"]*)"/g)].map(match => match[0]);

// These expectations are transcribed from the separately reviewed original
// PDFs and selected rasters. They never derive from the integration manifest.
const REVIEWED = {
  "abdon-cifuentes": {
    "document": {
      "fileName": "Brochure_AbdonCifuentes_mayo2026.pdf",
      "sha256": "790eac34ce7353365f5c765bd8399eeb12845fb31d6e02f6a8ae31e831f293d5",
      "pageCount": 16,
      "sourceChannel": "Yapo/IRIS"
    },
    "models": [
      [
        "estudio-p10",
        10,
        22.29,
        0,
        22.29,
        0,
        1,
        null
      ],
      [
        "1d1b-p11",
        11,
        30.57,
        1.94,
        32.51,
        1,
        1,
        null
      ],
      [
        "2d2b-p12",
        12,
        41.51,
        4.63,
        46.14,
        2,
        2,
        null
      ],
      [
        "2d2b-p13",
        13,
        47.07,
        5.73,
        52.8,
        2,
        2,
        null
      ]
    ],
    "images": [
      [
        1,
        2,
        "e154f29ff0ddd05a141b13e07992ffdccaa71427d527726ff4600bcde098af1b",
        "fachada",
        "693c5683ec90d6a75ef3d1fbe80df1a3da73d5eb02d2c8819f925645fd547f60",
        1600,
        1166
      ],
      [
        2,
        0,
        "00246306f1b68a4ad6c0f4b51eccdf7ec289dd44bcd4eacead8af20bb5e893dd",
        "hall-acceso",
        "ef8544dee425e9ef5a899ca6e2c11ea41ac355b72a0332d515228136397c13ff",
        2067,
        2200
      ],
      [
        8,
        2,
        "44940ce51867b7ef8e32d91c4d35c22325cf19be8f2fa84ac2f280c77b63598a",
        "salon-gourmet",
        "a940f904db182582adefbc88fc9395abf906a379167610b7ef6ebfc27ea0601e",
        2200,
        1314
      ]
    ],
    "plans": [
      [
        "estudio-p10",
        "c36bccb98405a57a7e9ab95edf3a0f886eb2e697e3b8d661ca755f32a1545a9f",
        3000,
        1688
      ],
      [
        "1d1b-p11",
        "fa6f5f6a90108e3416e841e84867b37c6ce33b1463c1fc16868bc045cef5043a",
        3000,
        1688
      ],
      [
        "2d2b-p12",
        "00b4f483b78beceac476e2c434639be3cde261de4ef07543cb414ec0a540a8fb",
        3000,
        1688
      ],
      [
        "2d2b-p13",
        "cfb2373f371793c874098424609d2a1e0a8805c57e084b4cd93d17a426724f0d",
        3000,
        1688
      ]
    ]
  },
  "don-ignacio": {
    "document": {
      "fileName": "Brochure_DonIgnacio_mayo2026.pdf",
      "sha256": "11fd8e276a5b72d6da4832d63f823810ffe1f80c4c83db8a97975cfc2b63961d",
      "pageCount": 21,
      "sourceChannel": "Yapo/IRIS"
    },
    "models": [
      [
        "estudio-p15",
        15,
        22.14,
        2.25,
        24.39,
        0,
        1,
        null
      ],
      [
        "1d1b-p16",
        16,
        32.61,
        2.95,
        35.56,
        1,
        1,
        null
      ],
      [
        "2d2b-p17",
        17,
        54.24,
        3.88,
        58.12,
        2,
        2,
        null
      ],
      [
        "2d2b-mariposa-p18",
        18,
        49.01,
        5.87,
        54.88,
        2,
        2,
        null
      ]
    ],
    "images": [
      [
        1,
        1,
        "5997f6de7f5e46bb068803f1bc624c09c6bc1145506d274a0b0b89d4e2bc750f",
        "fachada",
        "93aafd23ce2a88909051e9418e7b8a93c15a488bd440966e9d5206090aef8f3d",
        2200,
        2131
      ],
      [
        2,
        0,
        "3f038abd9af6a84b539db22a420fb3ab9315bcac3dceab202697ce0e27c11a43",
        "hall-acceso",
        "c61d4ea6cd7d6016e6b897158ecc6618a080ced2b6f6f37c1768914a12aa8d5c",
        2200,
        2200
      ],
      [
        7,
        2,
        "6d7a87fc09323fbb208d2ba1fab4f369ef5c7215be4bd83ffc35ff723070b9dd",
        "cowork",
        "700889438ac83f0c50b7924fe756484eaef00a064ab102d0f289033c9c0b7906",
        2200,
        1238
      ],
      [
        8,
        2,
        "0eea7069ef7b03306827a7b2c693242ef0f20b1a9f41e90482bf27edb27b0163",
        "lavanderia",
        "e49679da58c94476ebe88a0ae8c50cd4c50441ebe0fa58af228059af69217a12",
        2200,
        1238
      ],
      [
        9,
        2,
        "3b6ae91a4a16e2440c781b117ff88f5d7212a2a7510984e33e19f3ce555ae431",
        "quincho",
        "984be2c674222048d483010e7d766c76ce769bc1f784bdb9d3de2e3d0ccb997f",
        2200,
        1238
      ],
      [
        11,
        2,
        "87cacb4012028530af40522e1caa28f5ad70bf21106cfb98ebcb2abadb1b3af5",
        "gimnasio",
        "0a137bbf58d1c9eed02135c168374f4726302a933a8911ea75043d0ea3ca460d",
        2200,
        1238
      ],
      [
        12,
        2,
        "44f21fa8e6883e9e33d178919f372979200336c6630af37846c647e989be883c",
        "sky-bar",
        "e81c5fafa370e5b0352b8de68cc3633b337a807e657e3d957544e03e71afbf5b",
        2200,
        1042
      ],
      [
        13,
        2,
        "4697fec0ed4d8e4f83c26718382f7b57d892c1142dbe4a12bea9c0e1a69acf58",
        "salon-gourmet",
        "c3364d9fe3dcd8231333a22f87990b12e01fd378e9f1d1b7371d63fcd29297e5",
        2200,
        1100
      ]
    ],
    "plans": [
      [
        "estudio-p15",
        "0de6c5c29c3737e35af8af22ba7d944e21d557095c74b2646b41b61f7dd31064",
        3000,
        1688
      ],
      [
        "1d1b-p16",
        "b1eef77d9f20fff2341746e83ebc1b2311b00ed8666b0932414ad1cf13d3eb1d",
        3000,
        1688
      ],
      [
        "2d2b-p17",
        "2dfe88383d8177e76f78f4960e2e0db8bcf6005da44cb7130b7157038a962c14",
        3000,
        1688
      ],
      [
        "2d2b-mariposa-p18",
        "06c9acf878e839d5c41f9c561ef61ff292164f7726f140038a2e82bf5e9c42c8",
        3000,
        1688
      ]
    ]
  },
  "terrazzo": {
    "document": {
      "fileName": "Brochure_Terrazo_mayo2026.pdf",
      "sha256": "5c5e880dceb83d6fb0c0a80d78f1e5a51484408c437936811e028364a6c9a685",
      "pageCount": 18,
      "sourceChannel": "Yapo/IRIS"
    },
    "models": [
      [
        "estudio-p10",
        10,
        20.89,
        0.0,
        20.89,
        0,
        1,
        null
      ],
      [
        "1d1b-p11",
        11,
        33.75,
        3.43,
        37.18,
        1,
        1,
        null
      ],
      [
        "2d2b-p12",
        12,
        42.13,
        1.0,
        43.13,
        2,
        2,
        null
      ],
      [
        "2d2b-p13",
        13,
        49.57,
        2.37,
        51.94,
        2,
        2,
        null
      ],
      [
        "2d2b-mariposa-p14",
        14,
        51.58,
        1.29,
        52.87,
        2,
        2,
        null
      ],
      [
        "3d2b-p15",
        15,
        53.1,
        5.57,
        58.67,
        3,
        2,
        null
      ]
    ],
    "images": [
      [
        1,
        2,
        "8f8e804d635472c76047cfbf6677aec5fb6a483776881b5db8c156bbb6393579",
        "fachada",
        "9a764ba0568b71bc69efcac40b36ad3b48a2b6130e114c8ea944dcdc65a1a692",
        2200,
        1578
      ],
      [
        2,
        0,
        "4fbdcae7962a30a0d207a42c219606df8aa7fdc5af1973b3a5ecdb830b2ad8b7",
        "vista-aerea",
        "e1fbb53325b39bcbb050357331a5b99214d6ad801af35a99b48392a69328dbf9",
        2200,
        1467
      ],
      [
        7,
        2,
        "bd7df51ca56ec230dd0014cc4c1c09f5348450a0a9587e53b14c8c1b5cd3c738",
        "piscina",
        "258d54c862cac18d3a571006ff12d70ce455815e798b9627d9d5c24b179bdec3",
        2048,
        1152
      ],
      [
        8,
        2,
        "4e677c6229444b5a700bbcc31acdb6573f63624d395adeb212195e1ce520492a",
        "quincho",
        "5fcdacdbcccd2a1e72dfc03e3a752a697ca0e7e150da2896973e317692976021",
        2200,
        1238
      ]
    ],
    "plans": [
      [
        "estudio-p10",
        "3b3831066bb33d027c89de3e4987262a3772a1963e70a10b275f9671171180ad",
        3000,
        1688
      ],
      [
        "1d1b-p11",
        "e5be3e19123d19b9c531647848d30e5a2dbf49fde80967005a11876f6fed0032",
        3000,
        1688
      ],
      [
        "2d2b-p12",
        "d74ef6745f370437cb759b77cd3d9761a6f4ed252b44c4fc4ebcda1bb63515ae",
        3000,
        1688
      ],
      [
        "2d2b-p13",
        "ebff463c3b2a0eb1ccbc9f0a8ac1fea90927a7dc49717cc4f80acd1753978e8d",
        3000,
        1688
      ],
      [
        "2d2b-mariposa-p14",
        "a2cf8a38dd75f7983ed350f0e49bc67bfe0454d0a7de26270235a8aa78499d8e",
        3000,
        1688
      ],
      [
        "3d2b-p15",
        "e916cc8b2287619d51f070a155973a4943f218db2c021b58bc72778bc3a2ecaa",
        3000,
        1688
      ]
    ]
  },
  "vima": {
    "document": {
      "fileName": "Brochure_ViMA_mayo2026.pdf",
      "sha256": "1a4253e74dba77535e89dbb40790d98cfcc5ed4e693a1858c14de4526278efd9",
      "pageCount": 17,
      "sourceChannel": "Yapo/IRIS"
    },
    "models": [
      [
        "2d2b-p12",
        12,
        48.37,
        3.13,
        51.5,
        2,
        2,
        null
      ],
      [
        "1d1b-p13",
        13,
        28.57,
        2.99,
        31.56,
        1,
        1,
        null
      ],
      [
        "2d2b-p14",
        14,
        47.28,
        2.99,
        50.27,
        2,
        2,
        null
      ]
    ],
    "images": [
      [
        1,
        1,
        "d63f4594388aaa08e63bd24082b06d71890303122c6fff2ee19cd50c8aa5ae61",
        "fachada",
        "41228283075b71ca8683975f132a3a4cd4cf72193a7a771969a7caf0fc696af2",
        2200,
        2043
      ],
      [
        7,
        2,
        "bb2e2f899e58e0b0414325bf2cc8f1809b1e281e9a26424e84b8537d79ff824b",
        "piscina",
        "b785be4e74919c6bf228eb0afdcce06f2720c320d9943cdf1bc5982031b4653a",
        2200,
        1167
      ],
      [
        8,
        2,
        "823e0d52b180beb2851fcd17400bbe9d22a7a023ef003a2c1edf14f0e262985e",
        "gimnasio",
        "37ff0b6cf9fb513a561cbee796159c6fa565ce09f4a050241c511e033b2420ad",
        2200,
        1238
      ],
      [
        6,
        1,
        "e7216f8ff903f0bf2156db5d385e2e6b2b8e0233f3d91a24c410f1ef459c2154",
        "quincho",
        "cb3da9286233e6eac89f1ada4358a45e1bf0bd37dfc6d3b2715ef5cc11725a44",
        2200,
        1650
      ]
    ],
    "plans": [
      [
        "2d2b-p12",
        "30e9e5737998a5886bee359d7139ec2648af9c35fce09f789c06b20d863e4379",
        3000,
        1688
      ],
      [
        "1d1b-p13",
        "9c95eeb19e652f16b5b508324eadb340d066e17d4120bd21a594c15029da799c",
        3000,
        1688
      ],
      [
        "2d2b-p14",
        "fb100dc5e0733f20b9421c4e394768fdd0f4e0e95707d0e0b8bebe2d89addd80",
        3000,
        1688
      ]
    ]
  },
  "los-alerces": {
    "document": {
      "fileName": "Ingevec - Los Alerces.pdf",
      "sha256": "c93eaab1b4c5a398c7f49e98614a40781fb01f9428aba6c9fea7d52e2a7882bd",
      "pageCount": 13,
      "sourceChannel": "Yapo/IRIS"
    },
    "models": [
      [
        "1d1b-p10",
        10,
        35.1,
        3.0,
        38.1,
        1,
        1,
        null
      ],
      [
        "2d2b-p11",
        11,
        49.4,
        3.4,
        52.8,
        2,
        2,
        null
      ]
    ],
    "images": [
      [
        1,
        0,
        "f740304d54196f6f2279dbe6207663d9cbeaa26db975c2087c16e1a17707dfe5",
        "fachada",
        "bfa7cf165db8bdbbd1dd576de0491c91654806ac2ea917a2d98eccd37a77f75d",
        2000,
        1500
      ],
      [
        6,
        0,
        "42b163adf9a038c2c30621045ac31a278ae948009a2f8004ee7bac41168428ea",
        "sala-multiuso",
        "abfcde1baf027f4d288a7af5d5ab8e0ce6549da4f70ec46123ef205aea4696c6",
        2000,
        800
      ],
      [
        7,
        5,
        "1ca6f0edb9d5d76e0963b2d52f007c9e851ff9632204add2ed95fa4d20f6f99d",
        "gimnasio",
        "db1fa7fa0330555b204d46241ea4e77c4fe4215e2be7340e278c607565b4b405",
        1181,
        591
      ],
      [
        7,
        6,
        "20615cfb674f7a940c94f37f4d5ec48acceb3caa5ca1bdcedc7eeb7aba4c1d8b",
        "cowork",
        "ceacb27f793b587b3b8d3bc8093f496367bb0bc6b0720581debd29aec5b1075a",
        1052,
        584
      ],
      [
        7,
        7,
        "6b514b3b1be3046c6fcde66b2024303f0c0fe2287df5bfd1fc4cb70681b8d0d5",
        "sala-multiuso-alternativa",
        "79729aead2ffac611238dc148c5ecea0a4c4a9575cb6e6d66d04510284f17b88",
        2000,
        690
      ],
      [
        8,
        0,
        "423e1fcc83c130045155acbada24a586b05a24272976757c6d65b18347b4020d",
        "dormitorio-estar",
        "fc6876441d59bc08478d44a3423c937823104868b9abf8fe7bbb6d4fb2c8c574",
        2000,
        1110
      ],
      [
        9,
        5,
        "cdd4dc5d758af0cde4910a50b52c450cb8a1f87c0e5c9879c52463a53bda7679",
        "living",
        "7ad7b016cedc7305f8cf98297e1d33cac126cb2a49c1a1961f5c8127091b1461",
        1124,
        624
      ],
      [
        9,
        6,
        "3a2a4ae26cb14b2be76aa21c089ef2171d0ea0e7c6822abf82c8f373f3a970ff",
        "dormitorio-secundario",
        "df5f5086af20960442897425ed2e8077dfd9643594cadc6de1823470ab09df68",
        1045,
        580
      ],
      [
        9,
        7,
        "500915d908a2788099b959a5adeba511fe654f502230eebef616d118f168e167",
        "living-cocina",
        "81762119d9e3f3683dd7c94bd8c4b23e525ce3da9d970949d2d9acff3ab1ea1e",
        1234,
        615
      ],
      [
        9,
        8,
        "2b0a95e06d896cca627d9fc8e26cac91bcd9d7793366bbf6094719a89af5b1d9",
        "dormitorio-principal",
        "3385f24b63daa9528eeb5dd819b4b49ed2c95902b564637e5efff8d96aa973f9",
        985,
        616
      ]
    ],
    "plans": [
      [
        "1d1b-p10",
        "78148c8e6fc7ee8c6ffd069cc657755376afc4d9dd229181c75fc981d75ef02b",
        3000,
        1688
      ],
      [
        "2d2b-p11",
        "4d50a08634d9cf778e294da9080b2f662166be0ec49fa2210c99801d504ac715",
        3000,
        1688
      ]
    ]
  },
  "valle-los-ingleses-iii": {
    "document": {
      "fileName": "Ingevec - Valle los Ingleses III.pdf",
      "sha256": "509ad7aeaafec2b9e09354505a117aea77efb354a433a0d4eae27b08e6378f08",
      "pageCount": 13,
      "sourceChannel": "Yapo/IRIS",
      "etapa": "Etapa III"
    },
    "models": [
      [
        "2d1b-p08",
        8,
        42.14,
        4.45,
        46.59,
        2,
        1,
        "Etapa III"
      ],
      [
        "2d2b-p09",
        9,
        53.61,
        5.78,
        59.39,
        2,
        2,
        "Etapa III"
      ],
      [
        "3d1b-p10",
        10,
        62.23,
        4.57,
        66.8,
        3,
        1,
        "Etapa III"
      ],
      [
        "3d2b-p11",
        11,
        67.55,
        6.66,
        74.21,
        3,
        2,
        "Etapa III"
      ]
    ],
    "images": [
      [
        1,
        0,
        "82f20a1d971c1d84dfd4af5db08ba8121db43206cdca0f454c7a9495bcd55cd7",
        "fachada",
        "0d61b7588de485d71b4df69ad9aefb65743813bf5764bf9fd492c6e32602c072",
        2200,
        1238
      ],
      [
        5,
        0,
        "fcc140d0d5665b47cf0ba192d36fb1e76a828c6af068120f1cf73e9c672b54c2",
        "piscina",
        "8631a2e4b6e96cd4130c4f426e26e82fdf6104685d2713bc94daf3873b1785ef",
        1280,
        576
      ],
      [
        6,
        0,
        "bc7457ffee76039a380c0139ce614bbab0374b4077ce41d8bcfc79c584f44da7",
        "estar-comedor",
        "d607adbec407d25fd03e7ec87291d9f2585085ecda0362441fee574092b9743f",
        1920,
        1280
      ],
      [
        7,
        2,
        "9a3c487dc0321e115a8106ff09dc1e92a0ffc25ae008d7f8bd68901820374945",
        "comedor",
        "6663718ec8671ad0a1b220bed61951897bd05c9008827fbc8082715c5b656129",
        978,
        652
      ],
      [
        7,
        3,
        "ded4273b03abcc9cd401c1c397f210861f7dae4a239148d6d1a46ec524779f2a",
        "terraza",
        "430f71ef6cb76a6e994eff2abc3b6350c247472a71c62e71a9084469a7dd4743",
        989,
        660
      ],
      [
        7,
        5,
        "0e56e2b03de493b375e7aae9a2ea1ba8f08b56af7d23e27afab42f73fa2197c5",
        "cocina",
        "f03b8d6bd456adc9c4927bbfb2d5e2faa8e926ed762beecf6af05aab0a3157de",
        974,
        650
      ],
      [
        7,
        6,
        "a7e44dfe407857e7ef9c52f55adaa7019999f913dff2e0fc99cef2f2ea6321b3",
        "estar",
        "9aa1f269646b0da75f095c299664b258b92d082595b1f19efae512ff1e759bf7",
        1034,
        689
      ]
    ],
    "plans": [
      [
        "2d1b-p08",
        "ba5dcaa0f11d161be13fb7e4d908155e9ed7284e514a1da3ef2a45b5999d40f7",
        3000,
        1688
      ],
      [
        "2d2b-p09",
        "c966afd992259ab94c94d150ea036e74eb53f8fed05dbe4f5893b7ba706a9d83",
        3000,
        1688
      ],
      [
        "3d1b-p10",
        "77efaa34366eaabcd589ba8524907cd8a63620ef34623c925ec1b6176ccf3349",
        3000,
        1688
      ],
      [
        "3d2b-p11",
        "247926310acc567101ced10a73f6496693a4e294c40c6f49a72c7f330659ad4b",
        3000,
        1688
      ]
    ]
  }
};
const slugs = Object.keys(REVIEWED);
const record = slug => {
  const found = manifest.projects.find(project => project.slug === slug);
  assert.ok(found, slug + ': missing reviewed manifest record'); return found;
};

function webp(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'WebP container length');
  const chunks = []; let offset = 12; let dimensions;
  while (offset < bytes.length) {
    assert.ok(offset + 8 <= bytes.length, 'Complete WebP chunk header');
    const kind = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4), start = offset + 8;
    assert.ok(start + size <= bytes.length, 'Complete WebP chunk payload');
    chunks.push(kind);
    if (kind === 'VP8X') dimensions = [1 + bytes.readUIntLE(start + 4, 3), 1 + bytes.readUIntLE(start + 7, 3)];
    if (!dimensions && kind === 'VP8L') {
      const bits = bytes.readUInt32LE(start + 1);
      dimensions = [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    if (!dimensions && kind === 'VP8 ') dimensions = [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    offset = start + size + (size % 2);
  }
  assert.equal(offset, bytes.length);
  assert.ok(dimensions, 'Recognized WebP pixel dimensions');
  assert.ok(!chunks.includes('EXIF') && !chunks.includes('XMP '), 'Source EXIF or editorial metadata must be stripped');
  return dimensions;
}

test('definitive Ingevec portfolio retains ten prior records and 105 non-Ecasa non-Ingevec historical objects', () => {
  assert.equal(PORTFOLIO_BASELINE, BASELINE);
  assert.equal(priorCatalogue.length, 148);
  assert.equal(catalogue.length, 143);
  assert.equal(new Set(catalogue.map(project => project.slug)).size, 143);
  assertPortfolioData(current('data/proyectos.json'), old('data/proyectos.json'));
  assertPortfolioData(current('data/fichas-proyectos.json'), old('data/fichas-proyectos.json'), 'data/fichas-proyectos.json');
  assertPortfolioData(current('data/registro-fichas.json'), old('data/registro-fichas.json'), 'data/registro-fichas.json');
  const unaffected = priorCatalogue.filter(project => project.inmobiliaria !== 'Ingevec' && project.inmobiliaria !== 'Ecasa');
  assert.equal(unaffected.length, 105);
  assert.deepEqual(catalogue.filter(project => project.inmobiliaria !== 'Ingevec' && project.inmobiliaria !== 'Ecasa'), unaffected);
  for (const project of unaffected) assert.deepEqual(current(project.slug + '.html'), old(project.slug + '.html'), project.slug + ': unrelated HTML must be byte identical');
  assert.equal(priorManifest.projects.length, 10);
  assert.equal(manifest.projects.length, 16);
  assert.deepEqual(manifest.projects.slice(0, 10), priorManifest.projects);
  for (const project of priorManifest.projects) {
    assert.deepEqual(current(project.slug + '.html'), old(project.slug + '.html'), project.slug + ': earlier Ingevec HTML must remain exact');
    for (const asset of [...project.images, ...project.models.map(model => model.plan)]) {
      assert.equal(sha256(current(asset.localPath.slice(1))), asset.sha256, asset.localPath + ': earlier reviewed image or plan');
    }
  }
  assert.deepEqual(manifest.projects.slice(10).map(project => project.slug), slugs);
  const restored = restoreReviewedScope(manifest, priorManifest, 'data/brochures-ingevec.json');
  restored.projects = priorManifest.projects; delete restored.portfolioConsolidation;
  assert.deepEqual(restored, priorManifest, 'Existing rights and all top-level evidence remain exact');
});

test('six retired identities are absent from navigation, sitemap, context and financial inventory', () => {
  assert.deepEqual([...INGEVEC_REMOVED_SLUGS], ['brasil', 'vespucio-capital', 'edificio-serrano-capital', 'edificio-carrera-capital', 'edificio-froilan-roa', 'hacienda-lo-errazuriz']);
  assert.deepEqual([...INGEVEC_NEW_SLUGS], ['los-alerces', 'valle-los-ingleses-iii']);
  const priorRoutes = execFileSync('git', ['ls-tree', '--name-only', BASELINE], { cwd: ROOT }).toString().trim().split('\n').filter(path => path.endsWith('.html'));
  const expectedRoutes = [...priorRoutes.filter(path => !INGEVEC_REMOVED_SLUGS.has(path.replace(/\.html$/, '')) && !ECASA_RETIRED_SLUGS.has(path.replace(/\.html$/, ''))), ...[...INGEVEC_NEW_SLUGS, ...ECASA_NEW_SLUGS].map(slug => slug + '.html')].sort();
  assert.deepEqual(readdirSync(ROOT).filter(path => path.endsWith('.html')).sort(), expectedRoutes, 'Only six retired routes and two new routes are authorized');
  assertPortfolioIndex('lib/project-context.mjs', current('lib/project-context.mjs'));
  assertPortfolioIndex('sitemap.xml', current('sitemap.xml'));
  assert.deepEqual(contextualProjects, Object.fromEntries(catalogue.map(project => [project.slug, { name: project.nombre, url: project.detalleUrl }])));
  for (const slug of INGEVEC_REMOVED_SLUGS) {
    assert.equal(existsSync(resolve(ROOT, slug + '.html')), false, slug + ': retired route');
    assert.ok(!catalogue.some(project => project.slug === slug));
    assert.ok(!research.some(project => project.slug === slug));
    assert.equal(contextualProjects[slug], undefined);
    assert.ok(!current('sitemap.xml').toString().includes('https://sollahms.cl/' + slug + '.html'));
    for (const project of catalogue) assert.ok(!html(project.slug).includes('/' + slug + '.html'), project.slug + ': retired route referenced');
  }
  assertCatalogueConsultPrices(current('proyectos.html'), old('proyectos.html'));
  for (const file of ['comparador-hipotecario.html', 'contacto.html', 'agenda-asesoria.html', 'privacidad.html', 'index.html', 'data/hipotecario.json']) assert.deepEqual(current(file), old(file), file);
});

test('six original PDF identities pin all 23 printed model geometries and source-page bindings', () => {
  assert.equal(new Set(slugs.map(slug => REVIEWED[slug].document.sha256)).size, 6);
  let models = 0;
  for (const slug of slugs) {
    const reviewed = REVIEWED[slug], actual = record(slug);
    assert.deepEqual(actual.document, reviewed.document, slug + ': original source identity');
    assert.deepEqual(actual.models.map(model => [model.modelo, model.pagina_brochure, model.superficie_util_m2, model.terraza_m2, model.superficie_total_m2, model.dormitorios, model.banos, model.etapa ?? null]), reviewed.models, slug + ': independent printed dimensions');
    for (const model of actual.models) {
      assert.equal(model.sourceSha256, reviewed.document.sha256);
      assert.equal(model.plan.sourceSha256, reviewed.document.sha256);
      assert.equal(model.plan.sourcePage, model.pagina_brochure);
      assert.deepEqual(model.sourcePages, [model.pagina_brochure]);
      assert.equal(model.orientacion, null); assert.equal(model.pisos, null);
      assert.equal(model.approximate, true); assert.equal(model.visuallyVerified, true);
      assert.equal(model.plan.etapa ?? null, model.etapa ?? null);
      assert.equal(Math.round((model.superficie_util_m2 + model.terraza_m2) * 100), Math.round(model.superficie_total_m2 * 100));
      for (const key of ['precioDesdeUF', 'precioUF', 'availability', 'stock', 'entrega', 'fechaEntrega']) assert.equal(key in model, false, slug + '/' + model.modelo + ': no invented current commercial data');
    }
    models += actual.models.length;
  }
  assert.equal(models, 23);
});

test('36 selected native images and 23 full-page plans retain independent hashes, dimensions and metadata privacy', () => {
  let imageCount = 0, planCount = 0; const assetPaths = new Set(), identities = new Set();
  for (const slug of slugs) {
    const actual = record(slug), reviewed = REVIEWED[slug];
    assert.deepEqual(actual.images.map(image => [image.sourcePage, image.imageIndex, image.originalSha256, image.assetName, image.sha256, image.width, image.height]), reviewed.images, slug + ': native image selection');
    assert.deepEqual(actual.models.map(model => [model.modelo, model.plan.sha256, model.plan.width, model.plan.height]), reviewed.plans, slug + ': full-page plan fingerprints');
    assert.equal(new Set(actual.images.map(image => image.originalSha256)).size, actual.images.length, slug + ': duplicate scene');
    const hero = actual.images.find(image => image.localPath === actual.hero);
    assert.ok(hero); assert.equal(hero.gallery, false); assert.equal(actual.catalogueCover.localPath, actual.hero);
    const page = preview(html(slug));
    assert.ok(!section(page, 'galeria').includes('src="' + actual.hero + '"'), slug + ': hero duplicated in gallery');
    for (const image of actual.images) {
      const identity = [image.sourceSha256, image.sourcePage, image.imageIndex].join(':');
      assert.ok(!identities.has(identity)); identities.add(identity);
      assert.equal(image.sourceSha256, reviewed.document.sha256);
      assert.equal(image.visuallyVerified, true); assert.equal(image.privacySafe, true);
      assert.ok(Math.max(image.width, image.height) <= 2200);
      assert.ok(page.includes('src="' + image.localPath + '"'), image.localPath + ': missing image');
      imageCount++;
    }
    for (const model of actual.models) {
      assert.equal(model.plan.width, 3000); assert.equal(model.plan.height, 1688);
      assert.equal(model.plan.localPath, PREFIX + slug + '/plano-' + model.modelo + '.webp');
      assert.ok(page.includes('href="' + model.plan.localPath + '"'), model.modelo + ': enlarged plan link');
      assert.ok(page.includes('id="modelo-' + model.modelo + '"'), model.modelo + ': missing model');
      planCount++;
    }
    for (const asset of [...actual.images, ...actual.models.map(model => model.plan)]) {
      assert.ok(asset.localPath.startsWith(PREFIX + slug + '/'));
      assert.match(asset.localPath, /^\/assets\/propiedades\/ingevec-preview\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/);
      assert.ok(!assetPaths.has(asset.localPath)); assetPaths.add(asset.localPath);
      const file = resolve(ROOT, asset.localPath.slice(1)); assert.equal(lstatSync(file).isSymbolicLink(), false);
      const bytes = current(asset.localPath.slice(1)); assert.equal(sha256(bytes), asset.sha256, asset.localPath);
      assert.deepEqual(webp(bytes), [asset.width, asset.height], asset.localPath);
    }
  }
  assert.equal(imageCount, 36); assert.equal(planCount, 23); assert.equal(assetPaths.size, 59); assert.equal(identities.size, 36);
});

test('four enriched fichas preserve commercial content, SEO, scripts, map and consultation context', () => {
  for (const slug of ['abdon-cifuentes', 'don-ignacio', 'terrazzo', 'vima']) {
    const page = html(slug), prior = old(slug + '.html').toString();
    assertDefinitiveFicheFallback(page, slug);
    const reviewedStylesheet = '<!--INGEVEC_PREVIEW_START--><link rel="stylesheet" href="/assets/css/aj-brochure-preview.css?v=20261010"><!--INGEVEC_PREVIEW_END-->';
    assert.equal(head(page).split(reviewedStylesheet).length, 2, slug + ': exactly one approved brochure stylesheet');
    assert.equal(head(page).replace(reviewedStylesheet, ''), head(prior));
    assert.deepEqual(scripts(page), scripts(prior));
    assert.deepEqual(embeds(preview(page)), embeds(prior));
    for (const route of ['contacto', 'agenda-asesoria', 'comparador-hipotecario']) assert.ok(page.includes('/' + route + '.html?proyecto=' + slug));
  }
  for (const slug of slugs) {
    const text = visibleText(html(slug));
    assert.doesNotMatch(text, /Yapo|IRIS|SHA-?256|auditor[ií]a|procedencia|fecha de verificaci[oó]n|fuentes oficiales|p[aá]g\.|hashes?/i);
    assert.match(text, /referencial|referenciales|ilustrativo/i);
    assert.doesNotMatch(html(slug), /id="fuentes(?:-verificadas)?"/);
    assert.equal((preview(html(slug)).match(/class="aj-model"/g) ?? []).length, record(slug).models.length);
  }
});

test('two new identities use verified address maps, pending price and contextual consultation actions', () => {
  for (const [slug, name, address] of [['los-alerces', 'Los Alerces', 'Los Alerces 3254'], ['valle-los-ingleses-iii', 'Valle Los Ingleses III', 'Camino Los Ingleses 715']]) {
    const project = catalogue.find(row => row.slug === slug), page = preview(html(slug));
    assert.equal(project.nombre, name); assert.equal(project.direccion, address);
    for (const key of ['precioDesdeUF', 'estado', 'entrega']) assert.equal(project[key], null);
    assert.match(page, /Consultar precio/); assert.doesNotMatch(page, /"price"\s*:\s*\d/);
    assert.ok(page.includes('href="https://sollahms.cl/' + slug + '.html"'));
    for (const route of ['contacto', 'agenda-asesoria', 'comparador-hipotecario']) assert.ok(page.includes('/' + route + '.html?proyecto=' + slug));
    assert.match(page, /Consultar proyecto/); assert.match(page, /Agendar Asesoría/); assert.match(page, /Simular crédito hipotecario/);
    const location = section(page, 'ubicacion');
    const map = new URL(location.match(/data-embed-src="([^"]+)"/)[1].replaceAll('&amp;', '&'));
    assert.equal(map.hostname, 'www.google.com'); assert.equal(map.searchParams.get('output'), 'embed');
    assert.equal(map.searchParams.get('q'), project.mapQuery); assert.ok(!map.searchParams.has('ll'));
    const external = new URL(location.match(/href="(https:\/\/www\.google\.com\/maps\/search\/[^"]+)"/)[1].replaceAll('&amp;', '&'));
    assert.equal(external.searchParams.get('query'), project.mapQuery);
    assert.match(location, /por dirección|acceso exacto/);
    assert.match(section(page, 'recorrido'), /Consulta la disponibilidad/);
    assert.doesNotMatch(section(page, 'recorrido'), /matterport|<iframe/i);
  }
  assert.equal(record('valle-los-ingleses-iii').document.etapa, 'Etapa III');
  assert.ok(record('valle-los-ingleses-iii').models.every(model => model.etapa === 'Etapa III' && model.plan.etapa === 'Etapa III'));
});

test('financial classification changes only through six retirements and two unknown-price additions', () => {
  const dataset = json('data/hipotecario.json'), now = '2026-10-10';
  const input = { incomeClp: 3500000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
    savings: 20000000, savingsCurrency: 'CLP', monthlySavingsClp: 300000, horizonMonths: 24,
    downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25 };
  const result = new Map(catalogue.map(project => [project.slug, evaluateProject(project, input, dataset, now)]));
  assert.equal(result.size, 143);
  for (const project of priorCatalogue.filter(row => !INGEVEC_REMOVED_SLUGS.has(row.slug) && row.inmobiliaria !== 'Ecasa')) assert.deepEqual(result.get(project.slug), evaluateProject(project, input, dataset, now), project.slug + ': previous financial result');
  for (const slug of INGEVEC_REMOVED_SLUGS) assert.equal(result.has(slug), false);
  for (const slug of INGEVEC_NEW_SLUGS) {
    const project = catalogue.find(row => row.slug === slug), evaluation = result.get(slug);
    assert.equal(verifiedProjectPrice(project, now), null); assert.equal(evaluation.category, 'E');
    assert.equal(evaluation.price, null); assert.equal(evaluation.mortgage, null);
    assert.equal(evaluation.currentSavingsUf, null); assert.equal(evaluation.monthlyPaymentClp, null);
  }
  assert.equal([...result.values()].filter(value => value.price).length, 106);
});

test('all 636 historical assets survive outside the exact official UF UI change, and VIMA corrects only the association to El Aromo', () => {
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', BASELINE, '--', 'assets'], { cwd: ROOT }).toString().trim().split('\n');
  assert.equal(paths.length, 636);
  for (const path of paths) {
    if (['assets/js/hipotecario.mjs', 'assets/js/purchase-capacity-ui.mjs'].includes(path)) assertCommercialBytes(path, current(path), old(path));
    else assert.deepEqual(current(path), old(path), path + ': historical physical resource');
  }
  assert.deepEqual(current(WRONG_VIMA_IMAGE.slice(1)), old(WRONG_VIMA_IMAGE.slice(1)));
  assert.ok(html('el-aromo').includes(WRONG_VIMA_IMAGE));
  assert.ok(!html('vima').includes(WRONG_VIMA_IMAGE));
  assert.ok(!research.find(project => project.slug === 'vima').images.some(image => image.localPath === WRONG_VIMA_IMAGE));
  assert.ok(research.find(project => project.slug === 'el-aromo').images.some(image => image.localPath === WRONG_VIMA_IMAGE));
  const priorVima = priorCatalogue.find(project => project.slug === 'vima');
  assert.deepEqual(catalogue.find(project => project.slug === 'vima'), priorVima);
});

test('Vicuña Mackenna retains six independent plans and its exact prior stage-source assignment', () => {
  const prior = priorManifest.projects.find(project => project.slug === 'vicuna-mackenna-7589');
  const actual = manifest.projects.find(project => project.slug === 'vicuna-mackenna-7589');
  assert.deepEqual(actual, prior);
  const sources = [
    ['Etapa 1', 'ded2b0d73122c2160791e4dc1575e18a73dfc784fb397aad313638cab05c8cdc', 'e1-'],
    ['Etapa 2', 'ea21b26f8fc2df546b06faf9eeb8cdafbce76edbb37b0922e8a4cf13acdcfc94', 'e2-'],
  ];
  assert.equal(actual.models.length, 6); assert.equal(new Set(actual.models.map(model => model.plan.localPath)).size, 6);
  for (const [stage, hash, prefix] of sources) {
    const models = actual.models.filter(model => model.etapa === stage); assert.equal(models.length, 3);
    assert.deepEqual(models.map(model => model.pagina_brochure), [9, 10, 11]);
    for (const model of models) {
      assert.ok(model.modelo.startsWith(prefix)); assert.equal(model.sourceSha256, hash);
      assert.equal(model.plan.sourceSha256, hash); assert.equal(model.plan.etapa, stage);
      assert.equal(sha256(current(model.plan.localPath.slice(1))), model.plan.sha256);
    }
  }
  assert.deepEqual(current('vicuna-mackenna-7589.html'), old('vicuna-mackenna-7589.html'));
});

test('strict portfolio regression rejects unrelated data mutation and retired-project resurrection', () => {
  for (const mutate of [
    rows => { rows.find(project => project.inmobiliaria !== 'Ingevec').precioDesdeUF += 1; },
    rows => { rows.push(priorCatalogue.find(project => project.slug === 'brasil')); },
    rows => { rows.find(project => project.slug === 'los-alerces').precioDesdeUF = 3000; },
    rows => { rows.find(project => project.slug === 'valle-los-ingleses-iii').estado = 'Entrega inmediata'; },
  ]) {
    const tampered = structuredClone(catalogue); mutate(tampered);
    assert.throws(() => assertPortfolioData(Buffer.from(JSON.stringify(tampered)), old('data/proyectos.json')));
  }
});
