<script lang="ts">
  export let navigation: Map<string, string>;
  export let currentRoute: string;

  let toggleFlag = false;
  const toggle = () => {
    toggleFlag = !toggleFlag;
  };
</script>

<header class="sticky top-0 z-50 bg-white border-b">
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
        {#each navigation as [label, href]}
          <a
                  href={href}
                  class="text-zinc-950 hover:text-zinc-800 {currentRoute.replace(/\/$/, '') === href ? 'font-bold' : ''}"
          >
            {label}
          </a>
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
        {#each navigation as [label, href]}
          <a
                  href={href}
                  class="w-full text-lg text-zinc-800 hover:text-zinc-600 transition duration-200 ease-in-out {currentRoute.replace(/\/$/, '') === href ? 'font-semibold underline underline-offset-4 decoration-2 decoration-indigo-400' : ''}"
          >
            {label}
          </a>
        {/each}
      </div>
      <div class="mt-4 flex justify-center">
        <slot name="socials" />
      </div>
    </nav>
  {/if}
</header>
