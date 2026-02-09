"""Test quiz service functions."""
import pytest
from app.services.quiz_service import (
    calculate_xp, calculate_level, xp_to_next_level,
    check_achievements, ACHIEVEMENTS
)


class TestCalculateXP:
    """Tests for XP calculation."""
    
    def test_base_xp_easy(self):
        """Test base XP for easy difficulty."""
        xp = calculate_xp(correct=5, total=5, streak=0, difficulty="easy")
        # 5 correct * 5 base + 20 perfect bonus
        assert xp == 45
    
    def test_base_xp_medium(self):
        """Test base XP for medium difficulty."""
        xp = calculate_xp(correct=5, total=5, streak=0, difficulty="medium")
        # 5 correct * 10 base + 20 perfect bonus
        assert xp == 70
    
    def test_base_xp_hard(self):
        """Test base XP for hard difficulty."""
        xp = calculate_xp(correct=5, total=5, streak=0, difficulty="hard")
        # 5 correct * 15 base + 20 perfect bonus
        assert xp == 95
    
    def test_no_perfect_bonus(self):
        """Test that imperfect score doesn't get bonus."""
        xp = calculate_xp(correct=4, total=5, streak=0, difficulty="medium")
        # 4 correct * 10 base, no perfect bonus
        assert xp == 40
    
    def test_streak_bonus(self):
        """Test streak bonus."""
        xp = calculate_xp(correct=5, total=5, streak=5, difficulty="medium")
        # 5 * 10 + 20 perfect + 10 streak (5*2)
        assert xp == 80
    
    def test_streak_bonus_capped(self):
        """Test streak bonus is capped at 20."""
        xp = calculate_xp(correct=5, total=5, streak=20, difficulty="medium")
        # 5 * 10 + 20 perfect + 20 max streak
        assert xp == 90
    
    def test_zero_correct(self):
        """Test zero correct answers."""
        xp = calculate_xp(correct=0, total=5, streak=0, difficulty="medium")
        assert xp == 0


class TestCalculateLevel:
    """Tests for level calculation."""
    
    def test_level_1(self):
        """Test level 1 at 0 XP."""
        assert calculate_level(0) == 1
        assert calculate_level(50) == 1
        assert calculate_level(99) == 1
    
    def test_level_2(self):
        """Test level 2 at 100+ XP."""
        assert calculate_level(100) == 2
        assert calculate_level(200) == 2
        assert calculate_level(249) == 2
    
    def test_level_3(self):
        """Test level 3 at 250+ XP."""
        assert calculate_level(250) == 3
        assert calculate_level(400) == 3
    
    def test_high_levels(self):
        """Test high XP levels."""
        assert calculate_level(500) == 4
        assert calculate_level(1000) == 5
        assert calculate_level(2000) == 6
        assert calculate_level(32000) == 10


class TestXPToNextLevel:
    """Tests for XP to next level calculation."""
    
    def test_xp_needed_level_1(self):
        """Test XP needed from level 1."""
        assert xp_to_next_level(0) == 100
        assert xp_to_next_level(50) == 50
        assert xp_to_next_level(99) == 1
    
    def test_xp_needed_level_2(self):
        """Test XP needed from level 2."""
        assert xp_to_next_level(100) == 150
        assert xp_to_next_level(200) == 50
    
    def test_max_level(self):
        """Test max level returns 0."""
        assert xp_to_next_level(50000) == 0


class TestCheckAchievements:
    """Tests for achievement checking."""
    
    def test_first_quiz(self):
        """Test first quiz achievement."""
        achievements = check_achievements(
            total_questions=1,
            total_xp=10,
            level=1,
            best_streak=1,
            perfect_this_quiz=False,
            existing_achievements=[]
        )
        assert "first_quiz" in achievements
    
    def test_perfect_score(self):
        """Test perfect score achievement."""
        achievements = check_achievements(
            total_questions=5,
            total_xp=70,
            level=1,
            best_streak=5,
            perfect_this_quiz=True,
            existing_achievements=["first_quiz"]
        )
        assert "perfect_score" in achievements
    
    def test_streak_5(self):
        """Test streak 5 achievement."""
        achievements = check_achievements(
            total_questions=10,
            total_xp=100,
            level=2,
            best_streak=5,
            perfect_this_quiz=False,
            existing_achievements=["first_quiz"]
        )
        assert "streak_5" in achievements
    
    def test_streak_10(self):
        """Test streak 10 achievement."""
        achievements = check_achievements(
            total_questions=20,
            total_xp=300,
            level=3,
            best_streak=10,
            perfect_this_quiz=False,
            existing_achievements=["first_quiz", "streak_5"]
        )
        assert "streak_10" in achievements
    
    def test_level_5(self):
        """Test level 5 achievement."""
        achievements = check_achievements(
            total_questions=100,
            total_xp=1000,
            level=5,
            best_streak=10,
            perfect_this_quiz=False,
            existing_achievements=[]
        )
        assert "level_5" in achievements
    
    def test_hundred_questions(self):
        """Test 100 questions achievement."""
        achievements = check_achievements(
            total_questions=100,
            total_xp=500,
            level=4,
            best_streak=5,
            perfect_this_quiz=False,
            existing_achievements=["first_quiz"]
        )
        assert "hundred_questions" in achievements
    
    def test_thousand_xp(self):
        """Test 1000 XP achievement."""
        achievements = check_achievements(
            total_questions=50,
            total_xp=1000,
            level=5,
            best_streak=5,
            perfect_this_quiz=False,
            existing_achievements=[]
        )
        assert "thousand_xp" in achievements
    
    def test_no_duplicate_achievements(self):
        """Test that existing achievements aren't awarded again."""
        achievements = check_achievements(
            total_questions=5,
            total_xp=70,
            level=1,
            best_streak=5,
            perfect_this_quiz=True,
            existing_achievements=["first_quiz", "perfect_score", "streak_5"]
        )
        assert "first_quiz" not in achievements
        assert "perfect_score" not in achievements
        assert "streak_5" not in achievements
