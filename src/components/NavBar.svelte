<script lang="ts">
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
</script>

<header class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm" style="z-index: 1000;">
  <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
    <!-- Logo -->
    <div class="flex gap-8">
      <div class="flex-shrink-0">
        <a href="/" class="flex items-center group">
          <img src="/mark-transparent.png" alt="T4P logo" class="h-14 transition-transform duration-200 group-hover:scale-105" />
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
                on:mouseover={() => activeDropdown = label}
              >
                <a
                  href={item.href}
                  class="text-gray-900 hover:text-blue-600 font-medium transition-colors duration-200 {currentRoute.replace(/\/$/, '') === item.href ? 'text-blue-600' : ''}"
                >
                  {label}
                </a>
                <button
                  on:click={() => toggleDropdown(label)}
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
                  on:mouseleave={() => activeDropdown = null}
                >
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
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
    
    <!-- Right side: Donate -->
    <div class="hidden lg:flex items-center">
      <a
        href="/donate"
        class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
      >
        Donate
      </a>
    </div>

    <!-- Mobile Header -->
    <div class="flex lg:hidden items-center space-x-3">
      <a
        href="/donate"
        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Donate
      </a>
      <button on:click={toggle} class="text-gray-500 hover:text-gray-700 focus:outline-none p-2">
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
    <nav class="lg:hidden bg-white border-t border-gray-200 mx-4 my-2 p-6 rounded-xl shadow-lg animate-fadeIn">
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
                  on:click={() => toggleDropdown(label)}
                  class="ml-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <svg class="h-5 w-5 transform {activeDropdown === label ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              
              <!-- Mobile Dropdown Content -->
              {#if activeDropdown === label}
                <div class="mt-3 ml-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
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
