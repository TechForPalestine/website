<script lang="ts">
  export let navigation: Map<string, string>;
  export let currentRoute: string;

  let toggleFlag = false;

  const toggle = () => {
    toggleFlag = !toggleFlag;
  };
</script>

<header
  class="flex flex-col sticky w-full top-0 z-50 bg-white border-b max-md:flex-row max-md:justify-between max-md:px-4 max-md:items-center"
>
  <div class="relative flex w-full justify-between items-center">
    <nav
      class="flex flex-col md:flex-row lg:flex-row justify-center items-center w-full px-4 gap-4 py-2"
    >
      <a href="/" class="text-red-600 max-md:self-start">
        <!-- <slot name="tfp-logo"/> -->
        <img src="/mark-transparent.png" alt="tpf logo" class="h-12" />
      </a>
      <div
        class={`transition transform flex-grow  ${toggleFlag ? "max-md:block" : "max-md:hidden"}`}
      >
        <ul class="flex gap-4 max-md:flex-col">
          {#each navigation as [label, href]}
            <a {href}
               class="text-zinc-950 hover:text-zinc-800 {currentRoute.replace(/\/$/, '') === href ? 'font-bold' : ''}"
            >
              {label}
            </a>
          {/each}
        </ul>
      </div>
      <div class={toggleFlag ? "max-md:block" : "max-md:hidden"}>
        <slot name="socials" />
      </div>
      <div>
        <a href="/donate" class="bg-green-800 hover:bg-green-900 text-white font-semibold py-2 px-4 rounded-md">
          Donate
        </a>
      </div>
    </nav>
    <button
      class=" hover:cursor-pointer md:hidden max-md:self-start max-md:pt-2"
      on:click={toggle}
    >
      {#if toggleFlag}
        <slot name="close" />
      {:else}
        <slot name="burger-icon" />
      {/if}
    </button>
  </div>
</header>
