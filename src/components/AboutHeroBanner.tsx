const ABOUT_HERO_JPG = "/marketing/yaddii-about-banner.jpg";
const ABOUT_HERO_WEBP = "/marketing/yaddii-about-banner.webp";

export default function AboutHeroBanner() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 md:pt-4 pb-2">
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        <picture>
          <source srcSet={ABOUT_HERO_WEBP} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ABOUT_HERO_JPG}
            alt=""
            width={1920}
            height={972}
            decoding="async"
            className="w-full h-auto max-h-56 sm:max-h-64 md:max-h-80 object-cover object-[center_42%]"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </picture>
      </div>
    </div>
  );
}
