<template>
    <div>
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-semibold text-slate-900">Posts</h1>
            <NuxtLink
                to="/admin/posts/new"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
                New post
            </NuxtLink>
        </div>

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
                v-else-if="posts.length === 0"
                class="px-6 py-10 text-center text-slate-400 text-sm"
            >
                No posts yet.
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
                            Date
                        </th>
                        <th
                            class="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell"
                        >
                            Status
                        </th>
                        <th class="w-16" />
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr
                        v-for="post in posts"
                        :key="post.id"
                        class="hover:bg-slate-50 transition-colors"
                    >
                        <td class="px-4 py-3 font-medium text-slate-800">
                            {{ post.title }}
                        </td>
                        <td
                            class="px-4 py-3 text-slate-500 hidden sm:table-cell"
                        >
                            {{ post.expand?.category?.name ?? "—" }}
                        </td>
                        <td
                            class="px-4 py-3 text-slate-500 hidden sm:table-cell"
                        >
                            {{ formatDate(post.published_at) }}
                        </td>
                        <td class="px-4 py-3 hidden sm:table-cell">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                :class="
                                    post.published
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-slate-100 text-slate-500'
                                "
                            >
                                {{ post.published ? "Published" : "Draft" }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <NuxtLink
                                :to="`/admin/posts/${post.id}`"
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
const posts = ref<RecordModel[]>([]);

onMounted(async () => {
    posts.value = await pb.collection("posts").getFullList({
        sort: "-published_at",
        expand: "category",
    });
    loading.value = false;
});

const formatDate = (val: string) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
</script>
