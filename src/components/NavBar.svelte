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

<header class="sticky top-0  bg-white border-b" style="z-index: 1000;">
  <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
    <!-- Logo -->
    <div class="flex gap-4">
      <div class="flex-shrink-0">
        <a href="/" class="flex items-center">
          <img src="/mark-transparent.png" alt="tpf logo" class="h-12" />
        </a>
      </div>

      <!-- Desktop Navigation  -->
      <nav class="hidden md:flex md:items-center md:space-x-4">
        {#each navigation as [label, item]}
          <div class="relative">
            {#if item.submenu}
              <!-- Dropdown Menu Item -->
              <div
                class="flex items-center"
                on:mouseover={() => activeDropdown = label}
              >
                <a
                  href={item.href}
                  class="text-zinc-950 hover:text-zinc-800 {currentRoute.replace(/\/$/, '') === item.href ? 'font-bold' : ''}"
                >
                  {label}
                </a>
                <button
                  on:click={() => toggleDropdown(label)}
                  class="ml-1 text-zinc-950 hover:text-zinc-800"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              
              <!-- Dropdown Content -->
              {#if activeDropdown === label}
                <div 
                  class="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                  on:mouseleave={() => activeDropdown = null}
                >
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
                      class="block px-4 py-2 text-sm text-zinc-950 hover:bg-gray-100 {currentRoute.replace(/\/$/, '') === subHref ? 'font-semibold bg-gray-50' : ''}"
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
                class="text-zinc-950 hover:text-zinc-800 {currentRoute.replace(/\/$/, '') === item.href ? 'font-bold' : ''}"
              >
                {label}
              </a>
            {/if}
          </div>
        {/each}
      </nav>
    </div>
    <div class="hidden md:flex gap-5 items-center">
      <slot name="socials" />
      <div>
        <a
                href="/donate"
                class="bg-green-800 hover:bg-green-900 text-white font-semibold py-2 px-4 rounded-md"
        >
          Donate
        </a>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="flex md:hidden items-center space-x-2">
      <a
              href="/donate"
              class="bg-green-800 hover:bg-green-900 text-white font-semibold py-2 px-4 rounded-md"
      >
        Donate
      </a>
      <button on:click={toggle} class="text-gray-500 hover:text-gray-700 focus:outline-none">
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
    <nav class="md:hidden bg-white border-2 rounded-lg mx-4 my-2 p-4 animate-fadeIn">
      <div class="flex flex-col items-start space-y-3">
        {#each navigation as [label, item]}
          <div class="w-full">
            {#if item.submenu}
              <!-- Mobile Dropdown Item -->
              <div class="flex items-center justify-between w-full">
                <a
                  href={item.href}
                  class="flex-1 text-lg text-zinc-800 hover:text-zinc-600 transition duration-200 ease-in-out {currentRoute.replace(/\/$/, '') === item.href ? 'font-semibold underline underline-offset-4 decoration-2 decoration-indigo-400' : ''}"
                >
                  {label}
                </a>
                <button
                  on:click={() => toggleDropdown(label)}
                  class="ml-2 text-zinc-800 hover:text-zinc-600"
                >
                  <svg class="h-4 w-4 transform {activeDropdown === label ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              
              <!-- Mobile Dropdown Content -->
              {#if activeDropdown === label}
                <div class="mt-2 ml-4 space-y-2">
                  {#each item.submenu as [subLabel, subHref]}
                    <a
                      href={subHref}
                      class="block text-base text-zinc-700 hover:text-zinc-500 {currentRoute.replace(/\/$/, '') === subHref ? 'font-semibold text-indigo-600' : ''}"
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
                class="block w-full text-lg text-zinc-800 hover:text-zinc-600 transition duration-200 ease-in-out {currentRoute.replace(/\/$/, '') === item.href ? 'font-semibold underline underline-offset-4 decoration-2 decoration-indigo-400' : ''}"
              >
                {label}
              </a>
            {/if}
          </div>
        {/each}
      </div>
      <div class="mt-4 flex justify-center">
        <slot name="socials" />
      </div>
    </nav>
  {/if}
</header>
