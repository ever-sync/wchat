export default function ArrowIcon() {
  const path =
    "M0.5 0.500016L12.334 0.5M12.334 0.5L12.3339 12.334M12.334 0.5L0.500016 12.3339";

  return (
    <span className="icon">
      <i>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d={path} stroke="var(--white-color)" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d={path} stroke="var(--white-color)" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </i>
    </span>
  );
}
