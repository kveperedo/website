import { createLink } from "@tanstack/react-router";
import { Link as RACLink, MenuItem } from "react-aria-components";

export const Link = createLink(RACLink);
export const MenuItemLink = createLink(MenuItem);
