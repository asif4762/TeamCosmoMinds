// import React, { useMemo, useRef, useState } from "react";
// import HTMLFlipBook from "react-pageflip";
// import "./terra-book.css";
// import confetti from "canvas-confetti";
// import { Howl } from "howler";
// import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

// const flipSound = new Howl({ src: ["/sounds/page-flip.mp3"], volume: 0.25 });
// const chime = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.3 });

// /* Narration Hook */
// const useNarration = () => {
//   const utteranceRef = useRef(null);

//   const speak = (text) => {
//     stop();
//     if (!text) return;
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.voice = speechSynthesis.getVoices().find((v) => v.lang === "en-US");
//     utterance.pitch = 1;
//     utterance.rate = 1;
//     utteranceRef.current = utterance;
//     speechSynthesis.speak(utterance);
//   };

//   const pause = () => {
//     if (speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.pause();
//   };

//   const stop = () => {
//     if (speechSynthesis.speaking) speechSynthesis.cancel();
//   };

//   return { speak, pause, stop };
// };

// /* Generic Page Wrapper */
// const Page = React.forwardRef(({ children, className = "" }, ref) => (
//   <div className={`page ${className}`} ref={ref}>
//     <div className="page-content">{children}</div>
//   </div>
// ));

// /* Cover Page */
// const Cover = ({ coverImage }) => (
//   <div
//     className="cover-page"
//     style={{
//       position: "relative",
//       width: "100%",
//       height: "100%",
//       overflow: "hidden",
//       borderRadius: "15px",
//     }}
//   >
//     <div
//       style={{
//         backgroundImage: `url(${coverImage})`,
//         backgroundRepeat: "no-repeat",
//         backgroundPosition: "center",
//         backgroundSize: "cover",
//         width: "100%",
//         height: "100%",
//       }}
//     />
//   </div>
// );

// /* Country Intro Page */
// const CountryIntro = ({ country }) => (
//   <div className="country-intro">
//     <h2 className="country-title">{country.name}</h2>
//     <p className="country-lead">
//       Flying over <b>{country.name}</b> with Terra, the forests stretch thin across the land.
//       Fields that once glowed with life now soften into pale shades of green.
//       City rooftops shimmer under the relentless sun.
//       Every corner of the land seems to whisper a story of change.
//     </p>
//   </div>
// );

// /* Year Page */
// const YearPage = ({ name, year, image, caption, story }) => (
//   <div className="year-page">
//     <div className="year-head">
//       <h3 className="year-country">{name}</h3>
//       <div className="year-badge">{year}</div>
//     </div>

//     {image && (
//       <figure className="map-figure">
//         <img
//           src={image}
//           alt={`${name} ${year}`}
//           style={{
//             maxWidth: "100%",
//             maxHeight: "200px",
//             objectFit: "contain",
//             display: "block",
//             margin: "0 auto",
//           }}
//         />
//         {caption && <figcaption>{caption}</figcaption>}
//       </figure>
//     )}

//     {story && <p className="story mb-2">{story}</p>}
//   </div>
// );

// export default function TerraBook({ data }) {
//   const countries = data?.countries ?? [];
//   const { speak, pause, stop } = useNarration();
//   const [currentText, setCurrentText] = useState("");
//   const [currentPageIndex, setCurrentPageIndex] = useState(0);
//   const flipBookRef = useRef();

//   /* Build page list */
//   const pages = useMemo(() => {
//     const out = [];
//     out.push({ kind: "cover" });

//     countries.forEach((c) => {
//       out.push({ kind: "country-intro", country: c });
//       c.pages?.forEach((p) => out.push({ kind: "year", country: c, page: p }));
//     });

//     out.push({ kind: "back" });
//     if (out.length % 2 !== 0) out.push({ kind: "blank" });
//     return out;
//   }, [countries]);

//   /* Navigation functions */
//   const goToNextPage = () => {
//     if (flipBookRef.current && currentPageIndex < pages.length - 1) {
//       flipBookRef.current.pageFlip().flipNext();
//     }
//   };

//   const goToPrevPage = () => {
//     if (flipBookRef.current && currentPageIndex > 0) {
//       flipBookRef.current.pageFlip().flipPrev("bottom");
//     }
//   };

//   /* Handle page text for narration */
//   const handlePageText = (page) => {
//     switch (page.kind) {
//       case "cover":
//         setCurrentText("");
//         break;
//       case "country-intro":
//         setCurrentText(`Let's fly over ${page.country.name} with Terra. The greener it is, the better plants are doing.`);
//         break;
//       case "year":
//         setCurrentText(`${page.country.name} ${page.page.year}. ${page.page.story || ""}`);
//         break;
//       default:
//         setCurrentText("");
//     }
//   };

//   const handleFlip = (e) => {
//     flipSound.play();
//     stop();
//     const pageIndex = e.data;
//     setCurrentPageIndex(pageIndex);
//     handlePageText(pages[pageIndex]);

//     if (pages.length - pageIndex <= 2) {
//       chime.play();
//       confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 } });
//     }
//   };

//   return (
//     <div className="terra-book-container" style={{
//       position: "relative",
//       width: "100%",
//       height: "100%",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       padding: "20px",
//       boxSizing: "border-box"
//     }}>
//       {/* Book */}
//       <div style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         marginBottom: "20px"
//       }}>
//         <HTMLFlipBook
//           ref={flipBookRef}
//           width={380}
//           height={500}
//           maxShadowOpacity={0.4}
//           drawShadow
//           showCover
//           size="fixed"
//           className="terra-book"
//           onFlip={handleFlip}
//           style={{
//             margin: "0 auto"
//           }}
//         >
//           {pages.map((p, i) => {
//             switch (p.kind) {
//               case "cover":
//                 return (
//                   <Page className="cover" key={`p-${i}`}>
//                     <Cover coverImage={countries[0]?.coverImage} />
//                   </Page>
//                 );
//               case "country-intro":
//                 return (
//                   <Page key={`p-${i}`}>
//                     <CountryIntro country={p.country} />
//                   </Page>
//                 );
//               case "year":
//                 return (
//                   <Page key={`p-${i}`}>
//                     <YearPage
//                       name={p.country.name}
//                       year={p.page.year}
//                       image={p.page.image}
//                       caption={p.page.caption}
//                       story={p.page.story}
//                     />
//                   </Page>
//                 );
//               case "back":
//                 return (
//                   <Page key={`p-${i}`}>
//                     <div className="back">
//                       <h2>Thanks for reading!</h2>
//                       <p>Data: Terra MODIS NDVI (2000–2024)</p>
//                     </div>
//                   </Page>
//                 );
//               default:
//                 return <Page key={`p-${i}`} />;
//             }
//           })}
//         </HTMLFlipBook>
//       </div>

//       {/* Audio Controls - Under the book */}
//       {currentText && (
//         <div style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           gap: "12px",
//           marginBottom: "20px",
//           padding: "12px 20px",
//           backgroundColor: "rgba(0, 0, 0, 0.8)",
//           borderRadius: "25px",
//           backdropFilter: "blur(10px)",
//         }}>
//           <button
//             onClick={() => speak(currentText)}
//             style={{
//               width: "45px",
//               height: "45px",
//               borderRadius: "50%",
//               background: "radial-gradient(circle at 30% 30%, #1f75fe, #0b3d91)",
//               border: "2px solid rgba(255, 255, 255, 0.8)",
//               boxShadow: "0 0 15px #1f75fe, 0 0 30px #1f75fe55 inset",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               cursor: "pointer",
//               transition: "all 0.3s ease",
//             }}
//             title="Play narration"
//           >
//             <Play color="#fff" size={20} />
//           </button>

//           <button
//             onClick={pause}
//             style={{
//               width: "45px",
//               height: "45px",
//               borderRadius: "50%",
//               background: "radial-gradient(circle at 30% 30%, #ff5959, #ff2e2e)",
//               border: "2px solid rgba(255, 255, 255, 0.8)",
//               boxShadow: "0 0 15px #ff5959, 0 0 30px #ff595955 inset",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               cursor: "pointer",
//               transition: "all 0.3s ease",
//             }}
//             title="Pause narration"
//           >
//             <Pause color="#fff" size={20} />
//           </button>
//         </div>
//       )}

//       {/* Navigation Controls */}
//       <div style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "20px",
//         padding: "12px 24px",
//         backgroundColor: "rgba(0, 0, 0, 0.7)",
//         borderRadius: "25px",
//         backdropFilter: "blur(10px)",
//       }}>
//         <button
//           onClick={goToPrevPage}
//           disabled={currentPageIndex === 0}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//             padding: "10px 16px",
//             backgroundColor: currentPageIndex === 0 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
//             color: currentPageIndex === 0 ? "rgba(255, 255, 255, 0.4)" : "#fff",
//             border: "1px solid rgba(255, 255, 255, 0.3)",
//             borderRadius: "20px",
//             cursor: currentPageIndex === 0 ? "not-allowed" : "pointer",
//             fontSize: "14px",
//             fontWeight: "500",
//             transition: "all 0.3s ease",
//             backdropFilter: "blur(5px)"
//           }}
//           title="Previous page"
//         >
//           <ChevronLeft size={16} />
//           Previous
//         </button>

//         <div style={{
//           padding: "8px 16px",
//           backgroundColor: "rgba(255, 255, 255, 0.1)",
//           borderRadius: "15px",
//           color: "#fff",
//           fontSize: "14px",
//           fontWeight: "600",
//           minWidth: "80px",
//           textAlign: "center"
//         }}>
//           {currentPageIndex + 1} / {pages.length}
//         </div>

//         <button
//           onClick={goToNextPage}
//           disabled={currentPageIndex >= pages.length - 1}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//             padding: "10px 16px",
//             backgroundColor: currentPageIndex >= pages.length - 1 ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)",
//             color: currentPageIndex >= pages.length - 1 ? "rgba(255, 255, 255, 0.4)" : "#fff",
//             border: "1px solid rgba(255, 255, 255, 0.3)",
//             borderRadius: "20px",
//             cursor: currentPageIndex >= pages.length - 1 ? "not-allowed" : "pointer",
//             fontSize: "14px",
//             fontWeight: "500",
//             transition: "all 0.3s ease",
//             backdropFilter: "blur(5px)"
//           }}
//           title="Next page"
//         >
//           Next
//           <ChevronRight size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }
import React, { useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import "./terra-book.css";
import confetti from "canvas-confetti";
import { Howl } from "howler";
import { Play, Pause, ChevronLeft, ChevronRight, X } from "lucide-react";

const flipSound = new Howl({ src: ["/sounds/page-flip.mp3"], volume: 0.25 });
const chime = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.3 });

/* Narration Hook */
const useNarration = () => {
  const utteranceRef = useRef(null);

  const speak = (text) => {
    stop();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speechSynthesis.getVoices().find((v) => v.lang === "en-US");
    utterance.pitch = 1;
    utterance.rate = 1;
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.pause();
  };

  const stop = () => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
  };

  return { speak, pause, stop };
};

/* Generic Page Wrapper */
const Page = React.forwardRef(({ children, className = "" }, ref) => (
  <div className={`page ${className}`} ref={ref}>
    <div className="page-content">{children}</div>
  </div>
));

/* Cover Page */
const Cover = ({ coverImage }) => (
  <div
    className="cover-page"
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: "15px",
    }}
  >
    <div
      style={{
        backgroundImage: `url(${coverImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        width: "100%",
        height: "100%",
      }}
    />
  </div>
);

/* Country Intro Page */
const CountryIntro = ({ country }) => (
  <div className="country-intro">
    <h2 className="country-title">{country.name}</h2>
    <p className="country-lead">
      Flying over <b>{country.name}</b> with Terra, the forests stretch thin across the land.
      Fields that once glowed with life now soften into pale shades of green.
      City rooftops shimmer under the relentless sun.
      Every corner of the land seems to whisper a story of change.
    </p>
  </div>
);

/* Year Page */
const YearPage = ({ name, year, image, caption, story }) => (
  <div className="year-page">
    <div className="year-head">
      <h3 className="year-country">{name}</h3>
      <div className="year-badge">{year}</div>
    </div>

    {image && (
      <figure className="map-figure">
        <img
          src={image}
          alt={`${name} ${year}`}
          style={{
            maxWidth: "100%",
            maxHeight: "200px",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )}

    {story && <p className="story mb-2">{story}</p>}
  </div>
);

export default function TerraBook({ data, onClose }) {
  const countries = data?.countries ?? [];
  const { speak, pause, stop } = useNarration();
  const [currentText, setCurrentText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const flipBookRef = useRef();

  /* Build page list */
  const pages = useMemo(() => {
    const out = [];
    out.push({ kind: "cover" });

    countries.forEach((c) => {
      out.push({ kind: "country-intro", country: c });
      c.pages?.forEach((p) => out.push({ kind: "year", country: c, page: p }));
    });

    out.push({ kind: "back" });
    if (out.length % 2 !== 0) out.push({ kind: "blank" });
    return out;
  }, [countries]);

  /* Navigation functions */
  const goToNextPage = () => {
    if (flipBookRef.current && currentPageIndex < pages.length - 1) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const goToPrevPage = () => {
    if (flipBookRef.current && currentPageIndex > 0) {
      flipBookRef.current.pageFlip().flipPrev(); // natural flip
    }
  };

  /* Handle page text for narration */
  const handlePageText = (page) => {
    switch (page.kind) {
      case "cover":
        setCurrentText("");
        break;
      case "country-intro":
        setCurrentText(`Let's fly over ${page.country.name} with Terra. The greener it is, the better plants are doing.`);
        break;
      case "year":
        setCurrentText(`${page.country.name} ${page.page.year}. ${page.page.story || ""}`);
        break;
      default:
        setCurrentText("");
    }
  };

  const handleFlip = (e) => {
    flipSound.play();
    stop();
    const pageIndex = e.data;
    setCurrentPageIndex(pageIndex);
    handlePageText(pages[pageIndex]);

    if (pages.length - pageIndex <= 2) {
      chime.play();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 } });
    }
  };

  return (
    <div
      className="mt-3.5 backdrop-blur-sm"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      {/* Info text overlay */}
      <div
        style={{
          position: "absolute",
          top: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "6px 14px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "14px",
          zIndex: 10,
        }}
      >
        {currentPageIndex + 1} / {pages.length}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(0,0,0,0.7)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 11,
          }}
          title="Close book"
        >
          <X size={18} color="#fff" />
        </button>
      )}
      <div>
        {/* Book */}
        <HTMLFlipBook
          ref={flipBookRef}
          width={380}
          height={500}
          maxShadowOpacity={0.4}
          drawShadow
          showCover
          size="fixed"
          className="terra-book fade-in"
          onFlip={handleFlip}
          style={{ margin: "1 auto", }}
        >
          {pages.map((p, i) => {
            switch (p.kind) {
              case "cover":
                return (
                  <Page className="cover" key={`p-${i}`}>
                    <Cover coverImage={countries[0]?.coverImage} />
                  </Page>
                );
              case "country-intro":
                return (
                  <Page key={`p-${i}`}>
                    <CountryIntro country={p.country} />
                  </Page>
                );
              case "year":
                return (
                  <Page key={`p-${i}`}>
                    <YearPage
                      name={p.country.name}
                      year={p.page.year}
                      image={p.page.image}
                      caption={p.page.caption}
                      story={p.page.story}
                    />
                  </Page>
                );
              case "back":
                return (
                  <Page key={`p-${i}`}>
                    <div className="back">
                      <h2>Thanks for reading!</h2>
                      <p>Data: Terra MODIS NDVI (2000–2024)</p>
                    </div>
                  </Page>
                );
              default:
                return <Page key={`p-${i}`} />;
            }
          })}

        </HTMLFlipBook>
        {currentText && (
          <div className="narration-controls">
            <p className="narr-text">
              🔊 Listen to the story narration:
            </p>
            <button
              onClick={() => speak(currentText)}
              className="narr-btn blue"
              title="Play narration"
            >
              <Play color="#fff" size={20} />
            </button>
            <button
              onClick={pause}
              className="narr-btn red"
              title="Pause narration"
            >
              <Pause color="#fff" size={20} />
            </button>
          </div>

        )}

      </div>
      {/* Narration Controls */}


      {/* Navigation Controls */}
      <div className="nav-controls">
        <button onClick={goToPrevPage} disabled={currentPageIndex === 0} className="nav-btn flex items-center justify-center gap-3">
          <ChevronLeft size={16} /> Prev
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPageIndex >= pages.length - 1}
          className="nav-btn flex items-center justify-center gap-3"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
