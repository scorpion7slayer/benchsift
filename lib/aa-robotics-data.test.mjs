import assert from "node:assert/strict";
import test from "node:test";

import { movingStretches, parseAARobotics, parseRoboticsSearch, roboticsChunkPath, roboticsVersion } from "./aa-robotics-data.ts";
import { roboticsClipCaption, roboticsFailReason, roboticsTaskText } from "./aa-robotics-fr.ts";

/** The literals AA's minified page chunk carries, in its own syntax: `!0`, hex integers, `1/60`. */
const chunk = [
  'let p=[{id:"gpt-6-astra",name:"GPT-6 Astra",creatorName:"OpenAI",creatorColor:"#1f1f1f",harness:"Codex"},',
  '{id:"claude-opus-5-5",name:"Claude Opus 5.5",creatorName:"Anthropic",harness:"Claude Code"},',
  '{id:"no-runs",name:"No runs",creatorName:"Nobody",harness:"None"}],',
  'c=[{id:"press-red-button",name:"Press the red button",shortName:"Press Button",instruction:"Press the button with the gripper.",success:"The button flashes."},',
  '{id:"pour-drink-into-cup",name:"Pour the drink into the cup",shortName:"Pour Drink",instruction:"Pour the drink from the bottle into the cup.",success:"Drink is in the cup."}];',
  'let s={"gpt-6-astra":{"press-red-button":100,"pour-drink-into-cup":40},"claude-opus-5-5":{"press-red-button":100}};',
  'let m=[{file:"mistake-wall/a.mp4",issue:"grasp",model:"gpt-6-astra",task:"press-red-button",caption:"Has {braces}",startSeconds:3},',
  '{file:"../escape.mp4",issue:"grasp",model:"gpt-6-astra",task:"press-red-button",caption:"Outside the CDN folder"},',
  '{file:"b.mp4",issue:"grasp",model:"unknown-model",task:"press-red-button",caption:"Unknown model"}],',
  'i=[{id:"grasp",label:"Missed grasps",description:"The gripper did not hold",counts:{"gpt-6-astra":1}},{id:"unused",label:"Unused",description:"x",counts:{}}];',
  'let A=[{jobId:"arm-a__1",task:"press-red-button",model:"gpt-6-astra",pass:!0,minutes:2.2,costUsd:1.16,inputTokens:0xe0167c,timedOut:!1},',
  '{jobId:"arm-a__2",task:"pour-drink-into-cup",model:"gpt-6-astra",pass:!1,minutes:30,costUsd:10.84},',
  '{jobId:"arm-a__3",task:"press-red-button",model:"claude-opus-5-5",pass:!0,minutes:4.3,costUsd:.91},',
  '{jobId:"arm-a__4",task:"pour-drink-into-cup",model:"claude-opus-5-5",pass:!1,minutes:20,costUsd:null},',
  '{jobId:"arm-a__5",task:"unknown-task",model:"gpt-6-astra",pass:!0,minutes:1,costUsd:1}],',
  'a=[{task:"press-red-button",pass:!0,minutes:1/60},{task:"pour-drink-into-cup",pass:!0,minutes:4/60}];',
  'let T=[{model:"gpt-6-astra",task:"press-red-button",activeMinutes:2.1,share:{scene:2.7,plan:42.8},endSeconds:203,firstTaskActionSeconds:7.5,passingStateSeconds:0x14,actions:[[92,"n"]],activitySegments:"-75m120a48m30s10",thinkingBeforeFirstActionSeconds:120,pass:!0},',
  '{model:"gpt-6-astra",task:"pour-drink-into-cup",activeMinutes:30,share:{scene:1},actions:[],thinkingBeforeFirstActionSeconds:240,pass:!1},',
  '{model:"claude-opus-5-5",task:"press-red-button",activeMinutes:4,share:{scene:1},actions:[],thinkingBeforeFirstActionSeconds:null,pass:!0}];',
  'let H={"press-red-button__gpt-6-astra":"0129"};',
  "function o(){return{meanCostUsd:m/60*37.81}}",
].join("");

/** The article's RSC payload: title, task loops, the run explorer and the clip folder. */
const payload = [
  '2:["$","h1",null,{"children":"Introducing AA-Robotics v0.1"}]',
  '3:["$","$L20",null,{"src":"https://artificialanalysiscdn.com/article-assets/2026/aa-robotics/press-red-button.mp4","loop":true}]',
  '4:["$","$L20",null,{"src":"https://evil.example/aa-robotics/pour-drink-into-cup.mp4"}]',
  '5:["$","$L35",null,{"videoBaseUrl":"https://artificialanalysiscdn.com/article-assets/2026/aa-robotics/explore-v2","available":["press-red-button__gpt-6-astra","press-red-button__no-runs","bad__gpt-6-astra"]}]',
  '6:["$","$L36",null,{"clipBaseUrl":"https://artificialanalysiscdn.com/article-assets/2026/aa-robotics"}]',
].join("\n");

test("AA-Robotics reads the page chunk and aggregates attempts as the article does", () => {
  const data = parseAARobotics(chunk, payload);
  assert.equal(data.version, "v0.1");
  assert.deepEqual(data.tasks.map((task) => [task.id, task.short_name]), [
    ["press-red-button", "Press Button"],
    ["pour-drink-into-cup", "Pour Drink"],
  ]);
  // A model without attempts is left out; rows are ordered by score.
  assert.deepEqual(data.rows.map((row) => row.slug), ["gpt-6-astra", "claude-opus-5-5"]);
  const [astra, opus] = data.rows;

  assert.equal(astra.score, 70);
  assert.equal(astra.attempts, 2, "an attempt on an unknown task is ignored");
  assert.equal(astra.passes, 1);
  assert.equal(astra.cost_per_task_usd, 6);
  assert.equal(astra.minutes_per_task, 16.1);
  assert.equal(astra.first_action_minutes, 3);
  assert.equal(astra.harness, "Codex");
  assert.deepEqual(astra.task_scores, { "press-red-button": 100, "pour-drink-into-cup": 40 });

  // A task without a published score counts as zero, as on AA; an unknown cost leaves the mean unknown.
  assert.equal(opus.score, 50);
  assert.deepEqual(opus.task_scores, { "press-red-button": 100, "pour-drink-into-cup": 0 });
  assert.equal(opus.cost_per_task_usd, null);
  assert.equal(opus.first_action_minutes, null);

  assert.ok(Math.abs(data.human.minutes_per_task - 2.5 / 60) < 1e-12);
  assert.equal(data.human.hourly_wage_usd, 37.81);
  assert.ok(Math.abs(data.human.cost_per_task_usd - (2.5 / 60 / 60) * 37.81) < 1e-12);
});

test("AA-Robotics keeps only CDN videos of known tasks, models and runs", () => {
  const { media } = parseAARobotics(chunk, payload);
  const base = "https://artificialanalysiscdn.com/article-assets/2026/aa-robotics";
  assert.deepEqual(media.task_videos, { "press-red-button": `${base}/press-red-button.mp4` });
  assert.deepEqual(media.run_videos, {
    "press-red-button__gpt-6-astra": {
      url: `${base}/explore-v2/press-red-button__gpt-6-astra.mp4`,
      activity: "0129",
      end_seconds: 203,
      first_action_seconds: 7.5,
      passing_seconds: 20,
      fail_reason: null,
      moving: [[7.5, 19.5], [24.3, 27.3]],
      movement_windows: [[3.5, 31.3]],
    },
  });
  assert.deepEqual(media.clips, [{
    url: `${base}/mistake-wall/a.mp4`,
    model: "gpt-6-astra",
    task: "press-red-button",
    issue: "grasp",
    caption: "Has {braces}",
    start_seconds: 3,
  }]);
  assert.deepEqual(media.issues, [{ id: "grasp", label: "Missed grasps", description: "The gripper did not hold" }]);
  // Without the payload the data still parses, with no videos.
  assert.deepEqual(parseAARobotics(chunk).media, { task_videos: {}, run_videos: {}, issues: [], clips: [] });
});

test("AA-Robotics video state survives shared links and drops invalid values", () => {
  assert.deepEqual(
    parseRoboticsSearch({ task: "pour-drink-into-cup", model: "gpt-6-astra", camera: "overhead", issue: "grasp", clips: "claude-opus-5-5" }),
    { task: "pour-drink-into-cup", model: "gpt-6-astra", camera: "overhead", issue: "grasp", clips: "claude-opus-5-5" },
  );
  assert.deepEqual(parseRoboticsSearch({ task: "../x", camera: "left", issue: 3, model: "<script>" }), {});
});

test("AA-Robotics is empty when the chunk no longer carries the data", () => {
  assert.deepEqual(parseAARobotics("console.log(1)"), {
    version: null, tasks: [], rows: [], human: null, media: { task_videos: {}, run_videos: {}, issues: [], clips: [] },
  });
  assert.deepEqual(parseAARobotics('let p=[{id:"m",name:"M",harness:"H"}]').rows, []);
});

test("AA-Robotics finds the page chunk and version in the article payload", () => {
  const payload = '19:I[90799,["22104","static/chunks/app/%5Blocale%5D/articles/(code-authored)/aa-robotics/page-e27f7595d54a9a85.js"],"X"]\n'
    + '2:["$","h1",null,{"children":"Introducing AA-Robotics v0.1"}]';
  assert.equal(roboticsChunkPath(payload), "static/chunks/app/%5Blocale%5D/articles/(code-authored)/aa-robotics/page-e27f7595d54a9a85.js");
  assert.equal(roboticsVersion(payload), "v0.1");
  assert.equal(roboticsChunkPath('"static/chunks/app/../../evil/aa-robotics/page-0123456789abcdef.js"'), null);
  assert.equal(roboticsChunkPath('"static/chunks/app/x/aa-robotics/page-zz.js"'), null);
});

test("AA-Robotics moving stretches follow the activity segments", () => {
  // Tenths of a second; "m" is the arm moving.
  assert.deepEqual(movingStretches("-10m20a5m10"), [[1, 3], [3.5, 4.5]]);
  assert.deepEqual(movingStretches("-10m20a5m10", 0, 1), [[1, 4.5]], "close stretches merge");
  assert.deepEqual(movingStretches("m10-400m10", 4, 24), [[0, 5], [37, 46]], "padding never starts before zero");
  assert.deepEqual(movingStretches("-100s20"), []);
});

test("AA-Robotics French texts fall back to the English source", () => {
  const task = { id: "press-red-button", name: "Press the red button", short_name: "Press Button", instruction: "Press it.", success: "It flashes." };
  assert.equal(roboticsTaskText(task, "fr").short_name, "Bouton rouge");
  assert.equal(roboticsTaskText(task, "en").short_name, "Press Button");
  assert.equal(roboticsTaskText({ ...task, id: "new-task" }, "fr").name, "Press the red button");
  const clip = { url: "https://artificialanalysiscdn.com/article-assets/2026/aa-robotics/mistake-wall/unknown.mp4", caption: "New caption" };
  assert.equal(roboticsClipCaption(clip, "fr"), "New caption");
  assert.equal(roboticsFailReason("timed out", "en"), "timed out");
  assert.notEqual(roboticsFailReason("timed out", "fr"), "timed out");
  assert.equal(roboticsFailReason("melted", "fr"), "melted");
});
