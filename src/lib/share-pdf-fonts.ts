import { Font } from "@react-pdf/renderer";

let registerPromise: Promise<void> | null = null;

/** Register and preload Almarai from /public/fonts (CDN TTF paths were 404). */
export function ensureSharePdfFonts(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!registerPromise) {
    registerPromise = (async () => {
      const base = `${window.location.origin}/fonts`;
      Font.register({
        family: "Almarai",
        fonts: [
          { src: `${base}/Almarai-Regular.ttf`, fontWeight: 400 },
          { src: `${base}/Almarai-Bold.ttf`, fontWeight: 700 },
          { src: `${base}/Almarai-ExtraBold.ttf`, fontWeight: 800 },
        ],
      });
      await Promise.all([
        Font.load({ fontFamily: "Almarai", fontWeight: 400 }),
        Font.load({ fontFamily: "Almarai", fontWeight: 700 }),
        Font.load({ fontFamily: "Almarai", fontWeight: 800 }),
      ]);
    })();
  }

  return registerPromise;
}
