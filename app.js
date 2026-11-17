"use strict";

const cars = {
  normal: { name: "سيارة عادية", icon: "🚗", max: 180, power: 1, consumption: 1, heat: 1 },
  sport:  { name: "سيارة رياضية", icon: "🏎️", max: 260, power: 1.4, consumption: 1.5, heat: 1.3 },
  truck:  { name: "شاحنة", icon: "🚚", max: 120, power: 1.8, consumption: 2, heat: 1.2 }
};

const state = {
  type: "normal", speed: 0, rpm: 800, gear: "N", temperature: 85, fuel: 100,
  distance: 0, points: 0, totalPoints: 0, engineOn: true,
  clutch: false, gas: false, brake: false, cooling: false,
  upgrades: { engine: 0, cooling: 0, fuel: 0 },
  lastMilestone: 0, nextStation: 3, lastTime: performance.now()
};

const $ = id => document.getElementById(id);
const message = text => $("message").textContent = text;

document.querySelectorAll(".car-choice").forEach(button => {
  button.addEventListener("click", () => {
    if (state.speed > 0.5) return message("توقف أولاً لتغيير المركبة.");
    state.type = button.dataset.car;
    document.querySelectorAll(".car-choice").forEach(b => b.classList.toggle("active", b === button));
    $("carView").textContent = cars[state.type].icon;
    message("تم اختيار " + cars[state.type].name);
  });
});

document.querySelectorAll(".gear").forEach(button => {
  button.addEventListener("click", () => shiftGear(button.dataset.gear));
});

function shiftGear(value) {
  if (!state.engineOn) return message("شغل المحرك أولاً.");
  if (!state.clutch) return message("اضغط القابض قبل تغيير الترس!");
  const speed = Math.abs(state.speed);
  if (value === "R" && speed > 2) return message("توقف قبل اختيار الرجوع للخلف.");
  if (value !== "N" && value !== "R") {
    const g = Number(value);
    if (speed > g * 45 + 8) return message("السرعة مرتفعة جداً لهذا الترس.");
  }
  state.gear = value;
  document.querySelectorAll(".gear").forEach(b => b.classList.toggle("active", b.dataset.gear === value));
  message("تم اختيار الترس " + value);
}

// القابض يعمل بالتبديل: لمسة للتفعيل ولمسة ثانية للإلغاء.
$("clutch").addEventListener("click", () => {
  state.clutch = !state.clutch;
  $("clutch").classList.toggle("pressed", state.clutch);
  $("clutch").textContent = state.clutch ? "القابض مفعّل ✓\\nClutch ON" : "القابض\\nClutch";
  message(state.clutch
    ? "القابض مضغوط. اختر الترس الآن."
    : "تم تحرير القابض. يمكنك الضغط على البنزين للانطلاق.");
});

// البنزين والفرامل يعملان بالضغط المستمر، مع تثبيت اللمس حتى لو تحرك الإصبع قليلاً.
function bindHoldPedal(id, property) {
  const button = $(id);
  const down = event => {
    event.preventDefault();
    state[property] = true;
    if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
    button.classList.add("pressed");
  };
  const up = event => {
    event.preventDefault();
    state[property] = false;
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", down);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type =>
    button.addEventListener(type, up)
  );
  button.addEventListener("contextmenu", event => event.preventDefault());
}
bindHoldPedal("gas", "gas");
bindHoldPedal("brake", "brake");

$("coolButton").addEventListener("click", () => {
  state.cooling = !state.cooling;
  $("coolButton").textContent = state.cooling ? "❄️ إيقاف التبريد" : "❄️ تشغيل التبريد";
  $("coolText").textContent = state.cooling ? "نظام التبريد يعمل." : "نظام التبريد متوقف.";
});

$("engineButton").addEventListener("click", () => {
  state.engineOn = !state.engineOn;
  if (!state.engineOn) {
    state.gas = false; state.speed = 0; state.rpm = 0;
    $("engineButton").textContent = "تشغيل المحرك";
    message("تم إطفاء المحرك.");
  } else {
    state.rpm = 800;
    $("engineButton").textContent = "إطفاء المحرك";
    message("تم تشغيل المحرك.");
  }
});

$("refuelButton").addEventListener("click", () => {
  if (Math.abs(state.speed) > 0.5) return message("توقف تماماً في المحطة للتزود بالوقود.");
  if (state.distance + 0.001 < state.nextStation) return message("لا توجد محطة هنا. المحطة القادمة عند " + state.nextStation.toFixed(2) + " كم.");
  state.fuel = 100;
  state.nextStation += 3;
  message("تم ملء خزان الوقود بنجاح!");
});

document.querySelectorAll("[data-upgrade]").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.upgrade;
    if (state.points < 100) return message("ليس لديك نقاط كافية!");
    state.points -= 100;
    state.upgrades[type]++;
    message("تم شراء التطوير بنجاح!");
    updateUI();
  });
});

function updateUI() {
  $("speed").textContent = Math.round(Math.abs(state.speed));
  $("rpm").textContent = Math.round(state.rpm);
  $("gearDisplay").textContent = state.gear;
  $("temp").textContent = Math.round(state.temperature);
  $("fuel").textContent = Math.round(state.fuel);
  $("distance").textContent = state.distance.toFixed(2);
  $("points").textContent = state.points;
  $("shopPoints").textContent = state.points;
  $("totalPoints").textContent = state.totalPoints;
  $("nextPoints").textContent = Math.max(0, 100 - (state.distance * 1000 % 100)).toFixed(0) + " متر";
  $("tempBar").style.width = Math.min(100, state.temperature / 130 * 100) + "%";
  $("fuelBar").style.width = state.fuel + "%";
  $("fuelText").textContent = Math.round(state.fuel) + "%";
  $("tempText").textContent = state.temperature > 110 ? "مرتفعة جداً" : state.temperature > 100 ? "مرتفعة" : "طبيعية";
  $("engineState").textContent = state.temperature > 120 ? "خطر" : state.temperature > 110 ? "ساخن" : "سليم";
  $("engineState").className = state.temperature > 110 ? "warning" : "good";
  $("station").textContent = state.nextStation.toFixed(2) + " km";
  $("road").classList.toggle("stopped", Math.abs(state.speed) < 1);
  $("roadStatus").textContent = Math.abs(state.speed) > 0.5 ? "قيد الحركة" : "متوقف";
  $("mission").textContent = state.distance < 3 ? "انطلق لمسافة 3 كم" : "أكملت 3 كم! واصل القيادة";
}

function gameLoop(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;

  if (state.engineOn) {
    const car = cars[state.type];
    const gearNumber = Number(state.gear) || 0;
    if (state.gas && state.gear === "N") {
      // المحرك يرتفع صوته في الوضع المحايد لكن السيارة لا تتحرك.
      state.rpm = Math.min(4500, state.rpm + 180 * dt);
    }
    const upgradedPower = car.power * (1 + state.upgrades.engine * 0.15);
    const maxSpeed = car.max * (1 + state.upgrades.engine * 0.15);
    const canDrive = !state.clutch && state.fuel > 0 && state.temperature < 125;

    if (state.gas && gearNumber > 0 && canDrive) {
      let target = [0, 35, 65, 100, 145, 180][gearNumber];
      if (state.type === "truck") target = [0, 20, 40, 65, 90, 120][gearNumber];
      target = Math.min(target, maxSpeed);
      state.speed += (target - state.speed) * dt * 0.55 * upgradedPower;
    } else if (state.gear === "R" && state.gas && canDrive) {
      state.speed += (-20 - state.speed) * dt * 0.5;
    } else {
      state.speed *= Math.max(0, 1 - dt * (state.brake ? 0.12 : 0.10));
    }

    if (state.brake) state.speed *= Math.max(0, 1 - dt * 2.8);
    state.speed = Math.max(-20, Math.min(maxSpeed, state.speed));

    const load = state.gas && gearNumber > 0 && !state.clutch && state.fuel > 0 ? 1 : 0;
    state.rpm = load && gearNumber === 0 ? 2500 : 800 + Math.abs(state.speed) * 45 / Math.max(1, gearNumber);
    state.rpm = Math.min(6500, state.rpm);

    const coolingPower = state.cooling ? 4 + state.upgrades.cooling * 1.5 : 0.8;
    state.temperature += (load * car.heat * 2.5 - coolingPower) * dt;
    if (Math.abs(state.speed) < 1 && !state.gas) state.temperature -= 0.4 * dt;
    state.temperature = Math.max(65, Math.min(140, state.temperature));

    if (state.temperature > 125) {
      state.speed *= 0.97;
      message("تحذير: حرارة المحرك خطيرة! أوقف السيارة وشغل التبريد.");
    }
    if (state.cooling && state.temperature <= 90) state.temperature -= 0.5 * dt;

    const fuelUse = load * 0.035 * car.consumption * (1 - state.upgrades.fuel * 0.15) * dt;
    state.fuel = Math.max(0, state.fuel - fuelUse);
    if (state.fuel <= 0 && load) message("نفد الوقود! توجه إلى محطة الوقود.");

    state.distance += Math.abs(state.speed) * dt / 3600;
    const milestones = Math.floor(state.distance * 1000 / 100);
    if (milestones > state.lastMilestone) {
      const earned = (milestones - state.lastMilestone) * 10;
      state.points += earned;
      state.totalPoints += earned;
      state.lastMilestone = milestones;
    }
    if (state.distance >= state.nextStation) message("وصلت إلى محطة الوقود! توقف للتعبئة.");
  }

  updateUI();
  requestAnimationFrame(gameLoop);
}

updateUI();
requestAnimationFrame(gameLoop);
