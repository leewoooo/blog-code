import { ClassProvider, Injectable } from "@nestjs/common";

@Injectable()
export class MenuBard implements Menu {
  private menuList: MenuItem[];
  constructor(menuList: MenuItem[]) {
    this.menuList = menuList
  }

  choose(menuName: string): MenuItem | null {
    this.menuList.forEach((menuItem) => {
      if (menuItem.getName() === menuName) {
        return menuItem;
      }
    })
    return null;
  }
}
