import { ThemeController } from "./ThemeController";

export default function NavBar() {
  return (
    <div className="navbar bg-base-200 rounded-2xl">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <a className="text-3xl">midpoint</a>
      </div>
      <div className="navbar-end">
        <ThemeController />
      </div>
    </div>
  );
}
