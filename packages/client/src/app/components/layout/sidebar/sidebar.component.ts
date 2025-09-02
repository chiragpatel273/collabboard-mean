import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  currentUser: any = null;
  isCollapsed = false;

  navigationItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard',
      active: true,
    },
    {
      label: 'Projects',
      icon: '📁',
      route: '/projects',
      active: false,
    },
    {
      label: 'My Tasks',
      icon: '✓',
      route: '/tasks',
      active: false,
    },
    {
      label: 'Calendar',
      icon: '📅',
      route: '/calendar',
      active: false,
    },
    {
      label: 'Reports',
      icon: '📈',
      route: '/reports',
      active: false,
    },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  setActive(item: any): void {
    this.navigationItems.forEach((nav) => (nav.active = false));
    item.active = true;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout success handled by AuthService
      },
      error: (error) => {
        console.error('Logout error:', error);
      },
    });
  }
}
