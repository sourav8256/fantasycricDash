import re

def main():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. CSS
    css_insert = """
        /* Mental Sharpness Theme (Fuchsia & Slate) */
        body.theme-sharpness {
            --bg-primary: #fdf4ff;
            --accent-color: #c026d3;
            --accent-light: #fae8ff;
            --card-bg: #ffffff;
            --text-primary: #4a044e;
            --text-secondary: #c026d3;
        }
"""
    content = content.replace("        /* Mental Resilience Theme", css_insert + "\n        /* Mental Resilience Theme")

    # 2. Grid Button
    btn_insert = """
                <!-- App 10: Mental Sharpness -->
                <button onclick="openApp('sharpness')" class="flex flex-col items-center gap-2 group focus:outline-none">
                    <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white flex items-center justify-center text-2xl shadow-lg shadow-fuchsia-100 group-hover:scale-105 transition-all duration-300 border border-fuchsia-400/10">
                        <i class="fa-solid fa-bolt"></i>
                        <div id="badgeSharpness" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm hidden">0</div>
                    </div>
                    <span class="text-xs font-bold text-gray-500 group-hover:text-fuchsia-700 transition-colors uppercase tracking-wider text-[10px]">Mental Sharpness</span>
                </button>
"""
    content = content.replace("            </div>\n\n            <!-- Settings Trigger from Home -->", btn_insert + "            </div>\n\n            <!-- Settings Trigger from Home -->")

    # 3. View Screen
    # We will find the viewResilience div and copy it, replacing keywords.
    match = re.search(r'(        <!-- =================== APP 9: MENTAL RESILIENCE SCREEN =================== -->.*?)(        <!-- =================== APP 8: INTELLIGENCE SCREEN =================== -->)', content, flags=re.DOTALL)
    if match:
        resilience_html = match.group(1)
        sharpness_html = resilience_html.replace('APP 9: MENTAL RESILIENCE', 'APP 10: MENTAL SHARPNESS')
        sharpness_html = sharpness_html.replace('viewResilience', 'viewSharpness')
        sharpness_html = sharpness_html.replace('resilienceInput', 'sharpnessInput')
        sharpness_html = sharpness_html.replace('a mental resilience habit', 'a mental sharpness habit')
        sharpness_html = sharpness_html.replace('emerald', 'fuchsia')
        sharpness_html = sharpness_html.replace('addResilienceHabit', 'addSharpnessHabit')
        sharpness_html = sharpness_html.replace('resilienceList', 'sharpnessList')
        sharpness_html = sharpness_html.replace('pausedResilienceContainer', 'pausedSharpnessContainer')
        sharpness_html = sharpness_html.replace('Paused Resilience Activities', 'Paused Sharpness Activities')
        sharpness_html = sharpness_html.replace('pausedResilienceList', 'pausedSharpnessList')
        
        content = content.replace(match.group(2), sharpness_html + "\n" + match.group(2))

    # 4. JS Constants
    js_const_insert = """        const sharpnessList = document.getElementById('sharpnessList');
        const pausedSharpnessContainer = document.getElementById('pausedSharpnessContainer');
        const pausedSharpnessList = document.getElementById('pausedSharpnessList');\n"""
    content = content.replace("        const resilienceList = document.getElementById('resilienceList');", js_const_insert + "        const resilienceList = document.getElementById('resilienceList');")

    # 5. Keydown listener
    keydown_insert = """            document.getElementById('sharpnessInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addSharpnessHabit();
                }
            });\n"""
    content = content.replace("            document.getElementById('resilienceInput').addEventListener('keydown', (e) => {", keydown_insert + "            document.getElementById('resilienceInput').addEventListener('keydown', (e) => {")

    # 6. openApp
    openapp_insert = """            } else if (app === 'sharpness') {
                body.className = 'theme-sharpness h-screen flex flex-col overflow-hidden antialiased';
                document.getElementById('viewSharpness').classList.remove('hidden');
                headerIcon.className = 'fa-solid fa-bolt text-fuchsia-600';
                headerTitle.textContent = 'Mental Sharpness';\n"""
    content = content.replace("            } else if (app === 'resilience') {", openapp_insert + "            } else if (app === 'resilience') {")

    # 7. addHabit
    add_habit = """        function addSharpnessHabit() {
            const input = document.getElementById('sharpnessInput');
            const name = input.value.trim();
            if (!name) return;

            const h = {
                id: Date.now(),
                name: name,
                created: new Date().toISOString(),
                isEnabled: true,
                completedDates: [],
                notes: '',
                category: 'sharpness',
                targetDays: selectedTargetDays
            };

            habits.unshift(h);
            saveHabits();
            render();
            input.value = '';
            showToast('Mental Sharpness activity added');
        }

"""
    content = content.replace("        function addResilienceHabit() {", add_habit + "        function addResilienceHabit() {")

    # 8. render clear
    content = content.replace("            resilienceList.innerHTML = '';", "            sharpnessList.innerHTML = '';\n            resilienceList.innerHTML = '';")
    content = content.replace("            pausedResilienceList.innerHTML = '';", "            pausedSharpnessList.innerHTML = '';\n            pausedResilienceList.innerHTML = '';")

    # 9. render append
    append_insert = """                } else if (habit.category === 'sharpness') {
                    if (habit.isEnabled) {
                        sharpnessList.appendChild(createWorkCard(habit));
                        activeSharpnessCount++;
                    } else {
                        pausedSharpnessList.appendChild(createWorkCard(habit));
                        pausedSharpnessCount++;
                    }\n"""
    content = content.replace("                } else if (habit.category === 'resilience') {", append_insert + "                } else if (habit.category === 'resilience') {")

    # 10. Counts variables initialization (need to find where they are defined, maybe locally in render())
    # Let's add them before activeResilienceCount
    content = content.replace("let activeResilienceCount = 0;", "let activeSharpnessCount = 0; let activeResilienceCount = 0;")
    content = content.replace("let pausedResilienceCount = 0;", "let pausedSharpnessCount = 0; let pausedResilienceCount = 0;")

    # 11. totalActive logic
    content = content.replace("(currentActiveApp === 'resilience' ? activeResilienceCount : 1)))))))", "(currentActiveApp === 'resilience' ? activeResilienceCount : (currentActiveApp === 'sharpness' ? activeSharpnessCount : 1))))))))")

    # 12. Badges logic updateBadges()
    badges_insert = """            const activeSharpnessBadge = habits.filter(h => h.category === 'sharpness' && h.isEnabled);
            const badgeSharpnessEl = document.getElementById('badgeSharpness');
            if (activeSharpnessBadge.length > 0) {
                badgeSharpnessEl.textContent = activeSharpnessBadge.length;
                badgeSharpnessEl.classList.remove('hidden');
            } else {
                badgeSharpnessEl.classList.add('hidden');
            }\n"""
    content = content.replace("            const activeResilienceBadge = habits.filter(h => h.category === 'resilience' && h.isEnabled);", badges_insert + "            const activeResilienceBadge = habits.filter(h => h.category === 'resilience' && h.isEnabled);")

    # 13. container visibility
    vis_insert = """            if (pausedSharpnessCount > 0) {
                pausedSharpnessContainer.classList.remove('hidden');
            } else {
                pausedSharpnessContainer.classList.add('hidden');
            }\n"""
    content = content.replace("            if (pausedResilienceCount > 0) {", vis_insert + "            if (pausedResilienceCount > 0) {")

    # 14. category dropdown or settings
    content = content.replace("} else if (category === 'resilience') {", "} else if (category === 'sharpness') { return 'Mental Sharpness'; } else if (category === 'resilience') {")

    # 15. Settings edit Category button
    btn2 = """                        <button onclick="setEditCategory('sharpness')" id="editCategorySharpness" class="flex-1 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all">Mental Sharpness</button>\n"""
    content = content.replace('                        <button onclick="setEditCategory(\'resilience\')" id="editCategoryResilience" class="flex-1 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all">Mental Resilience</button>', btn2 + '                        <button onclick="setEditCategory(\'resilience\')" id="editCategoryResilience" class="flex-1 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all">Mental Resilience</button>')

    # 16. setEditCategory condition logic
    content = content.replace("|| editSelectedCategory === 'resilience') {", "|| editSelectedCategory === 'resilience' || editSelectedCategory === 'sharpness') {")
    content = content.replace("document.getElementById('editCategoryResilience').className =", "document.getElementById('editCategorySharpness').className = (cat === 'sharpness') ? 'flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-emerald-600 bg-emerald-50 text-emerald-700 text-center transition-all' : 'flex-1 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all text-gray-500 hover:bg-gray-50';\n            document.getElementById('editCategoryResilience').className =")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Patch applied successfully.")

if __name__ == '__main__':
    main()
