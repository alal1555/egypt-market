const ABOUT_HERO_PNG = "/marketing/yaddii-about-banner.png";
const ABOUT_HERO_WEBP = "/marketing/yaddii-about-banner.webp";
const ABOUT_HERO_JPG = "/marketing/yaddii-about-banner.jpg";

export default function AboutHeroBanner() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 md:pt-4 pb-2">
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-900/5 shadow-sm">
        <picture>
          <source srcSet={ABOUT_HERO_WEBP} type="image/webp" />
          <source srcSet={ABOUT_HERO_PNG} type="image/png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ABOUT_HERO_JPG}
            alt=""
            width={1280}
            height={648}
            decoding="async"
            className="w-full h-auto max-h-52 sm:max-h-60 md:max-h-72 object-cover object-[center_42%]"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </picture>
      </div>
    </div>
  );
}
