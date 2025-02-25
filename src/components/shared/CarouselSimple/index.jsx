import styles from "./carouselSimple.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import Title from "../Title";
import Section from "../Section";

const CarouselSimple = ({
  slides,
  numberSlidesView = 1,
  textTitle,
  delay = 3000,
}) => {
  return (
    <Section>
      <div data-aos="zoom-in" className={styles.container}>
        {textTitle && <Title text={textTitle} align="center" />}
        <Swiper
          pagination={{
            clickable: true,
          }}
          slidesPerView={numberSlidesView}
          spaceBetween={30}
          autoplay={{
            delay: delay,
            disableOnInteraction: false,
          }}
          navigation={true}
          modules={[Pagination, Autoplay, Navigation]}
          className={styles.slides}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>{slide.content}</SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Section>
  );
};

export default CarouselSimple;
// import { useState, useRef } from "react";

// interface CarouselProps {
//   items: { id: number; content: JSX.Element }[];
//   visibleItems?: number;
// }

// const CarouselSimple = ({ items, visibleItems = 1 }: CarouselProps) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [dragStartX, setDragStartX] = useState<number | null>(null);
//   const [dragOffset, setDragOffset] = useState(0);
//   const containerRef = useRef<HTMLDivElement | null>(null);

//   const totalItems = items.length;

//   const slideWidth = 100 / visibleItems;

//   const nextSlide = () => {
//     setCurrentIndex((prev) =>
//       Math.min(prev + visibleItems, totalItems - visibleItems)
//     );
//   };

//   const prevSlide = () => {
//     setCurrentIndex((prev) => Math.max(prev - visibleItems, 0));
//   };

//   const handleDotClick = (index: number) => {
//     setCurrentIndex(index);
//   };

//   const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
//     const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
//     setDragStartX(clientX);
//   };

//   const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
//     if (dragStartX === null) return;

//     const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
//     const offset = clientX - dragStartX;
//     setDragOffset(offset);
//   };

//   const handleDragEnd = () => {
//     if (dragOffset > 50 && currentIndex > 0) {
//       prevSlide();
//     } else if (dragOffset < -50 && currentIndex < totalItems - visibleItems) {
//       nextSlide();
//     }

//     setDragStartX(null);
//     setDragOffset(0);
//   };

//   return (
//     <div className={styles.carouselContainer}>
//       <button className={styles.carouselButton} onClick={prevSlide}>
//         &#10094;
//       </button>
//       <div
//         className={styles.carouselTrack}
//         ref={containerRef}
//         style={{
//           display: "flex",
//           transform: `translateX(calc(-${
//             currentIndex * slideWidth
//           }% + ${dragOffset}px))`,
//           transition: dragStartX === null ? "transform 0.3s ease" : "none",
//         }}
//         onMouseDown={handleDragStart}
//         onMouseMove={handleDragMove}
//         onMouseUp={handleDragEnd}
//         onMouseLeave={handleDragEnd}
//         onTouchStart={handleDragStart}
//         onTouchMove={handleDragMove}
//         onTouchEnd={handleDragEnd}
//       >
//         {items.map((item) => (
//           <div
//             key={item.id}
//             className={styles.carouselItem}
//             style={{
//               flex: `0 0 ${slideWidth}%`,
//               boxSizing: "border-box",
//             }}
//           >
//             {item.content}
//           </div>
//         ))}
//       </div>
//       <button className={styles.carouselButton} onClick={nextSlide}>
//         &#10095;
//       </button>
//       <div className={styles.dots}>
//         {Array.from({ length: Math.ceil(totalItems / visibleItems) }).map(
//           (_, index) => (
//             <button
//               key={index}
//               className={`${styles.dot} ${
//                 index === Math.floor(currentIndex / visibleItems)
//                   ? styles.active
//                   : ""
//               }`}
//               onClick={() => handleDotClick(index * visibleItems)}
//             ></button>
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default CarouselSimple;
