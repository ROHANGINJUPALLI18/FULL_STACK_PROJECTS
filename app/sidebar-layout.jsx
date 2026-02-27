"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconLayoutDashboard, IconReceipt } from "@tabler/icons-react";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import ModalComponent from "@/components/ModalComponent";

const links = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <IconLayoutDashboard className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Amounts",
    href: "/amounts",
    icon: (
      <IconReceipt className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

export default function SidebarLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar>
        <SidebarBody className="border-r h-screen border-neutral-200 dark:border-neutral-700">
          <div className="flex h-full flex-col">
            <div className="mb-6">
              <SidebarLink
                link={{
                  label: "Bill Management",
                  href: "/",
                  icon: (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                      BM
                    </div>
                  ),
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-6 md:p-8">{children}</main>
      <FloatingActionButton />
      <ModalComponent />
    </div>
  );
}
