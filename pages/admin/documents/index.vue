<template>
    <div>
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-semibold text-slate-900">Documents</h1>
            <NuxtLink
                to="/admin/documents/new"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
                Upload document
            </NuxtLink>
        </div>

        <!-- Search + filter -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="search"
                type="search"
                placeholder="Search documents…"
                class="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
            <select
                v-model="categoryFilter"
                class="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All categories</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                </option>
            </select>
        </div>

        <!-- List -->
        <div
            class="bg-white border border-slate-200 rounded-lg overflow-hidden"
        >
            <div
                v-if="loading"
                class="px-6 py-10 text-center text-slate-400 text-sm"
            >
                Loading…
            </div>
            <div
                v-else-if="filtered.length === 0"
                class="px-6 py-10 text-center text-slate-400 text-sm"
            >
                No documents found.
            </div>
            <table v-else class="w-full text-sm">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th
                            class="text-left px-4 py-3 font-medium text-slate-600"
                        >
                            Title
                        </th>
                        <th
                            class="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell"
                        >
                            Category
                        </th>
                        <th
                            class="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell"
                        >
                            Year
                        </th>
                        <th class="w-16" />
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr
                        v-for="doc in filtered"
                        :key="doc.id"
                        class="hover:bg-slate-50 transition-colors"
                    >
                        <td class="px-4 py-3 font-medium text-slate-800">
                            {{ doc.title }}
                        </td>
                        <td
                            class="px-4 py-3 text-slate-500 hidden sm:table-cell"
                        >
                            {{ doc.expand?.category?.name ?? "—" }}
                        </td>
                        <td
                            class="px-4 py-3 text-slate-500 hidden sm:table-cell"
                        >
                            {{ doc.year || "—" }}
                        </td>
                        <td class="px-4 py-3">
                            <NuxtLink
                                :to="`/admin/documents/${doc.id}`"
                                class="text-blue-600 hover:text-blue-800 font-medium"
                                >Edit</NuxtLink
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RecordModel } from "pocketbase";

definePageMeta({ layout: "admin", middleware: "auth" });

const { pb } = useAuth();

const loading = ref(true);
const documents = ref<RecordModel[]>([]);
const categories = ref<RecordModel[]>([]);
const search = ref("");
const categoryFilter = ref("");

onMounted(async () => {
    const [docs, cats] = await Promise.all([
        pb
            .collection("documents")
            .getFullList({ sort: "-sort_order", expand: "category" }),
        pb.collection("document_categories").getFullList({ sort: "-name" }),
    ]);
    documents.value = docs;
    categories.value = cats;
    loading.value = false;
});

const filtered = computed(() => {
    return documents.value.filter((doc) => {
        const matchesSearch =
            !search.value ||
            doc.title.toLowerCase().includes(search.value.toLowerCase());
        const matchesCategory =
            !categoryFilter.value || doc.category === categoryFilter.value;
        return matchesSearch && matchesCategory;
    });
});
</script>
