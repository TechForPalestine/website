<script lang="ts">
  import { tick } from 'svelte';

  export let navigation: Map<string, {href: string, submenu: Array<[string, string]> | null}>;
  export let currentRoute: string;

  let toggleFlag = false;
  let activeDropdown: string | null = null;

  const toggle = () => {
    toggleFlag = !toggleFlag;
  };

  const toggleDropdown = (label: string) => {
    activeDropdown = activeDropdown === label ? null : label;
  };

  const closeDropdown = () => {
    activeDropdown = null;
  };

  // navigate within an open dropdown menu
  const handleMenuKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDropdown();
      // Return focus to trigger button
      const trigger = document.querySelector(`[data-dropdown="${activeDropdown}"]`) as HTMLElement;
      trigger?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentTarget = e.target as HTMLElement;
      const nextItem = currentTarget.nextElementSibling as HTMLElement;
      if (nextItem) {
        nextItem.focus();
      } else {
        // Wrap to first item
        const menu = currentTarget.parentElement;
        const firstItem = menu?.querySelector('a:first-of-type') as HTMLElement;
        firstItem?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentTarget = e.target as HTMLElement;
      const prevItem = currentTarget.previousElementSibling as HTMLElement;
      if (prevItem) {
        prevItem.focus();
      } else {
        // Wrap to last item
        const menu = currentTarget.parentElement;
        const lastItem = menu?.querySelector('a:last-of-type') as HTMLElement;
        lastItem?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      const currentTarget = e.target as HTMLElement;
      const menu = currentTarget.parentElement;
      const firstItem = menu?.querySelector('a:first-of-type') as HTMLElement;
      firstItem?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const currentTarget = e.target as HTMLElement;
      const menu = currentTarget.parentElement;
      const lastItem = menu?.querySelector('a:last-of-type') as HTMLElement;
      lastItem?.focus();
    }
  };

  // Control the dropdown button
  const handleButtonKeydown = async (e: KeyboardEvent, label: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(label);
    } else if (e.key === 'Escape' && activeDropdown) {
      closeDropdown();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeDropdown !== label) {
        activeDropdown = label;
        await tick();
      }
      const dropdown = document.querySelector(`[data-dropdown="${label}"]`)
        ?.closest('.relative')
        ?.querySelector('[role="menu"] a') as HTMLElement;
      dropdown?.focus();
    }
  };
</script>

<header class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm" style="z-index: 1000;">
  <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
    <!-- Logo -->
    <div class="flex gap-8">
      <div class="flex-shrink-0">
        <a href="/" class="flex items-center group">
          <img src="/images/new-homepage/Logo_less_padding.webp" alt="T4P logo" class="object-cover transition-transform duration-200 group-hover:scale-105" style="height: 4.5rem; width: 125px;" />
        </a>
      </div>

      <!-- Desktop Navigation  -->
      <nav class="hidden lg:flex lg:items-center lg:space-x-8">
        {#each navigation as [label, item]}
          <div class="relative">
            {#if item.submenu}
              <!-- Dropdown Menu Item -->
              <div
                class="flex items-center group"
                role="none"
                on:mouseover={() => activeDropdown = label}
                on:focus={() => activeDropdown = label}
              >
                <a
                  href={item.href}
                  on:focus={() => activeDropdown = label}
                  class="text-gray-900 hover:text-blue-600 font-medium transition-colors duration-200 {currentRoute.replace(/\/$/, '') === item.href ? 'text-blue-600' : ''}"
                >
                  {label}
                </a>
                <button
                  type="button"
                  on:click={() => toggleDropdown(label)}
                  on:keydown={(e) => handleButtonKeydown(e, label)}
                  on:focus={() => activeDropdown = label}
                  data-dropdown={label}
                  aria-label="Toggle {label} dropdown menu"
                  aria-expanded={activeDropdown === label}
                  aria-haspopup="menu"
                  class="ml-1 text-gray-400 group-hover:text-blue-600 transition-colors duration-200"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

              <!-- Dropdown Content -->
              {#if activeDropdown === label}
                <div
                  class="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                  role="menu"
                  tabindex="-1"
                  aria-label="{label} submenu"
                  on:mouseleave={() => activeDropdown = null}
                >
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
                      role="menuitem"
                      on:keydown={handleMenuKeydown}
                      class="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 {currentRoute.replace(/\/$/, '') === subHref ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
                    >
                      {subLabel}
                    </a>
                  {/each}
                </div>
              {/if}
            {:else}
              <!-- Regular Menu Item -->
              <a
                href={item.href}
                class="text-gray-900 hover:text-blue-600 font-medium transition-colors duration-200 {currentRoute.replace(/\/$/, '') === item.href ? 'text-blue-600' : ''}"
              >
                {label}
              </a>
            {/if}
          </div>
        {/each}
      </nav>
    </div>
    
    <!-- Right side: Socials and Donate -->
    <div class="hidden lg:flex gap-6 items-center">
      <slot name="socials" />
      <div>
        <a
          href="/donate"
          class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-10 text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
        >
          Donate
        </a>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="flex lg:hidden items-center space-x-3">
      <a
        href="/donate"
        class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      >
        Donate
      </a>
      <button
        type="button"
        on:click={toggle}
        aria-label={toggleFlag ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={toggleFlag}
        aria-controls="mobile-menu"
        class="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
      >
        {#if toggleFlag}
          <slot name="close" />
        {:else}
          <slot name="burger-icon" />
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile Navigation Menu -->
  {#if toggleFlag}
    <nav
      id="mobile-menu"
      class="lg:hidden bg-white border-t border-gray-200 mx-4 my-2 p-6 rounded-xl shadow-lg animate-fadeIn"
      aria-label="Mobile navigation"
    >
      <div class="flex flex-col items-start space-y-4">
        {#each navigation as [label, item]}
          <div class="w-full">
            {#if item.submenu}
              <!-- Mobile Dropdown Item -->
              <div class="flex items-center justify-between w-full">
                <a
                  href={item.href}
                  class="flex-1 text-lg text-gray-800 hover:text-blue-600 transition duration-200 ease-in-out {currentRoute.replace(/\/$/, '') === item.href ? 'font-semibold text-blue-600' : ''}"
                >
                  {label}
                </a>
                <button
                  type="button"
                  on:click={() => toggleDropdown(label)}
                  on:keydown={(e) => handleButtonKeydown(e, label)}
                  data-dropdown={label}
                  aria-label="Toggle {label} dropdown menu"
                  aria-expanded={activeDropdown === label}
                  aria-haspopup="menu"
                  class="ml-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <svg class="h-5 w-5 transform {activeDropdown === label ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

              <!-- Mobile Dropdown Content -->
              {#if activeDropdown === label}
                <div
                  class="mt-3 ml-4 space-y-2 bg-gray-50 p-4 rounded-lg"
                  role="menu"
                  tabindex="-1"
                  aria-label="{label} submenu"
                >
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
                      role="menuitem"
                      on:keydown={handleMenuKeydown}
                      class="block text-base text-gray-700 hover:text-blue-600 transition-colors duration-200 {currentRoute.replace(/\/$/, '') === subHref ? 'font-medium text-blue-600' : ''}"
                    >
                      {subLabel}
                    </a>
                  {/each}
                </div>
              {/if}
            {:else}
              <!-- Regular Mobile Item -->
              <a
                href={item.href}
                class="block w-full text-lg text-gray-800 hover:text-blue-600 transition duration-200 ease-in-out {currentRoute.replace(/\/$/, '') === item.href ? 'font-semibold text-blue-600' : ''}"
              >
                {label}
              </a>
            {/if}
          </div>
        {/each}
      </div>
      <div class="mt-6 flex justify-center">
        <slot name="socials" />
      </div>
    </nav>
  {/if}
</header>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
</style>
