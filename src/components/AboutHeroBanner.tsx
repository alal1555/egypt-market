const ABOUT_HERO_SRC = "/marketing/yaddii-about-banner.jpg";

export default function AboutHeroBanner() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 md:pt-4 pb-2">
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ABOUT_HERO_SRC}
          alt=""
          className="w-full h-auto max-h-56 sm:max-h-64 md:max-h-80 object-cover object-[center_42%]"
        />
      </div>
    </div>
  );
}
