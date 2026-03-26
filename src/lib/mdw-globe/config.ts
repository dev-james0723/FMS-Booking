/** Image URLs and CTA rules for the D Gallery 3D globe (matches provided embed). */
export const MDW_IMAGE_URLS: string[] = [
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c7617a53db0b7f09182e_01.jpg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c76184d82a78d81092bd_02.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c764c529ab62721196af_03.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c84f20e5ce5bf74414a1_04.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c7627fa9c07187c59584_05.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c761338f671e2f9667a5_06.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c7617e9f88a4d287a073_07.jpg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c762a4beaa7ca777ad30_08.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c76259f51b2a55bedab2_09.jpg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c75dab6879304aa5f444_10.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c76221ce88092c231569_11.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945c75e9cbf6f3c751d9be6_12.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d16f9b805d11d664383a_13.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d608a48e251ee6beb9e4_14.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d607ea26e0362a47bbee_15.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d60776a5b89c25bfb044_16.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d60832ba22ea93efddb5_17.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d607b662dbdca100c429_18.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d6087be6a79495402dc8_19.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6945d6086501003723ebd729_20.jpeg",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c546492c95a6eb94c77e_23.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c545e1cd8f2d7bc4d545_24.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c546f36ce8dce4acb588_25.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c5440a018ab6d75e8c89_26.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c546d6e13c8aaea7ecfa_27.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c546abbe2895cdb1d294_29.avif",
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/6946c545c8fe75789801917c_30.avif",
];

export const MDW_LOGO_URL =
  "https://cdn.prod.website-files.com/692f0ba55905e9d22c848d0d/694636b7632ca564732cefbd_IMG_6961.PNG";

export const MDW_AUTO_SPEED_MULTIPLIER = 1.3;

export type MdwCtaRule = { from: number; to: number; label: string; href: string };

export const MDW_CTA_RULES: MdwCtaRule[] = [
  { from: 0, to: 2, label: "Explore Mission", href: "https://d-festival.org/d-festival-mission" },
  { from: 3, to: 5, label: "Explore Programs", href: "https://d-festival.org/2026-d-festival-programs" },
  { from: 6, to: 8, label: "Explore IDPC", href: "https://d-festival.org/international-d-masters-piano-competition-2026" },
  { from: 9, to: 11, label: "Explore 2026 Faculty", href: "https://d-festival.org/2026-faculty" },
  { from: 12, to: 9999, label: "Explore 2026 Faculty", href: "https://d-festival.org/2026-faculty" },
];
